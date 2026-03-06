'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Download, CheckCircle, XCircle, Filter, Users, Award } from 'lucide-react'
import { clsx } from 'clsx'
import Link from 'next/link'

export default function ComprovantesPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const atividadeId = params.id

    const [atividade, setAtividade] = useState<any>(null)
    const [inscritos, setInscritos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [emitindo, setEmitindo] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            // 1. Atividade
            const { data: ativ } = await supabase.from('atividades').select('*').eq('id', atividadeId).single()
            setAtividade(ativ)

            // 2. Inscritos e suas presenças
            const { data: inscData } = await supabase
                .from('inscricoes')
                .select(`
                    id,
                    users!cidadao_id ( id, nome, cpf ),
                    presencas ( id, presente )
                `)
                .eq('entidade_id', atividadeId)
                .eq('status', 'confirmada')

            if (inscData) {
                // Cálculo de presença
                const totalEncontros = ativ?.datas?.length || 0
                const processed = inscData.map(i => {
                    const presencasConfirmadas = i.presencas?.filter((p: any) => p.presente).length || 0
                    const percentual = totalEncontros > 0 ? (presencasConfirmadas / totalEncontros) * 100 : 0
                    return {
                        ...i,
                        percentual,
                        apto: percentual >= (ativ?.presenca_minima || 0)
                    }
                })
                setInscritos(processed)
            }
            setLoading(false)
        }
        fetchData()
    }, [atividadeId, supabase])

    const handleEmitirEmLote = async () => {
        const aptos = inscritos.filter(i => i.apto)
        if (aptos.length === 0) {
            alert("Nenhum participante apto para emissão.")
            return
        }

        if (!confirm(`Deseja emitir comprovantes para os ${aptos.length} participantes aptos?`)) return

        setEmitindo(true)
        // Mock de processo em background
        await new Promise(r => setTimeout(r, 2000))
        alert(`${aptos.length} comprovantes gerados com sucesso e disponíveis para download individual ou envio por e-mail.`)
        setEmitindo(false)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando dados de presença...</div>

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#2D9E6B] mb-2">
                        <Link href="/atividades" className="hover:underline">Atividades</Link>
                        <span>/</span>
                        <span className="text-gray-400">Emissão de Comprovantes</span>
                    </nav>
                    <h1 className="text-2xl font-black text-[#1A3C4A]">{atividade?.titulo}</h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <Filter className="w-3 h-3" /> Regra: Mínimo de <strong>{atividade?.presenca_minima}%</strong> de presença.
                    </p>
                </div>
                <button
                    onClick={handleEmitirEmLote}
                    disabled={emitindo}
                    className="bg-[#2D9E6B] hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-green-900/10 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                    <Award className="w-4 h-4" /> {emitindo ? 'Processando...' : 'Emitir para Aptos'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-[#1A3C4A]">{inscritos.length}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Inscritos</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-[#2D9E6B] rounded-xl">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-[#1A3C4A]">{inscritos.filter(i => i.apto).length}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Aptos</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <XCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-2xl font-black text-[#1A3C4A]">{inscritos.filter(i => !i.apto).length}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Inaptos</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Participante</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-center">Presença</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {inscritos.map(insc => (
                            <tr key={insc.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-gray-800">{insc.users?.nome}</p>
                                    <p className="text-[10px] text-gray-500">{insc.users?.cpf}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600">
                                        {Math.round(insc.percentual)}%
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={clsx(
                                        "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                                        insc.apto ? "bg-green-100 text-[#2D9E6B]" : "bg-red-100 text-red-600"
                                    )}>
                                        {insc.apto ? 'Apto' : 'Inapto'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        disabled={!insc.apto}
                                        className="text-[#2D9E6B] hover:text-green-700 disabled:opacity-20 transition-all p-2 hover:bg-teal-50 rounded-lg"
                                        title="Baixar comprovante individual"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
