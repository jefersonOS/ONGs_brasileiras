'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Award, CheckCircle2, AlertCircle, FileText, Send, Download, RefreshCw, ArrowLeft, Eye } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'

export default function CourseCertificatesPage({ params }: { params: { id: string, turmaId: string } }) {
    const { id: cursoId, turmaId } = params
    const supabase = createClient()

    const [curso, setCurso] = useState<any>(null)
    const [participantes, setParticipantes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [issuing, setIssuing] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            const { data: cursoData } = await supabase.from('cursos').select('*').eq('id', cursoId).single()
            const { data: turmaData } = await supabase.from('turmas').select('*').eq('id', turmaId).single()

            if (cursoData) setCurso(cursoData)
            // if (turmaData) setTurma(turmaData) // Removed unused

            // Buscar inscritos e suas presenças
            const { data: inscritos } = await supabase
                .from('inscricoes')
                .select(`
                    id, 
                    users(id, nome, cpf, whatsapp, email),
                    presencas(id, presente, encontro_id),
                    certificados(id, status, codigo_validacao, url_pdf)
                `)
                .eq('turma_id', turmaId)
                .eq('status', 'confirmada')

            if (inscritos) {
                // Calcular total de encontros distintos a partir das presenças registradas
                const allEncontroIds = new Set(
                    inscritos.flatMap((ins: any) => ins.presencas?.map((p: any) => p.encontro_id) || [])
                )
                const totalEncontros = allEncontroIds.size || 0
                const processed = inscritos.map((ins: any) => {
                    const presencasConfirmadas = ins.presencas?.filter((p: any) => p.presente).length || 0
                    const percentual = totalEncontros > 0 ? Math.round((presencasConfirmadas / totalEncontros) * 100) : (presencasConfirmadas > 0 ? 100 : 0)
                    return {
                        ...ins,
                        presencas_count: presencasConfirmadas,
                        totalEncontros,
                        percentual,
                        apto: percentual >= (cursoData?.presenca_minima || 75),
                        certificado: ins.certificados?.[0] || null
                    }
                })
                setParticipantes(processed)
            }
            setLoading(false)
        }
        fetchData()
    }, [cursoId, turmaId, supabase])

    const handleIssueBatch = async () => {
        const aptosSemCertificado = participantes.filter(p => p.apto && !p.certificado)
        if (aptosSemCertificado.length === 0) return alert('Nenhum aluno apto para emissão no momento.')

        if (!confirm(`Deseja emitir certificados para ${aptosSemCertificado.length} alunos aptos?`)) return

        setIssuing(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const res = await fetch(`/api/cursos/turmas/${turmaId}/emitir-certificados`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inscritosIds: aptosSemCertificado.map(p => p.id),
                    tenantId: user?.user_metadata?.tenant_id
                })
            })

            if (!res.ok) throw new Error('Erro na API')

            alert('Certificados emitidos com sucesso!')
            window.location.reload()
        } catch (err) {
            console.error(err)
            alert('Erro durante a emissão em lote.')
        } finally {
            setIssuing(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500 text-sm animate-pulse">Calculando elegibilidade dos certificados...</div>

    const totalAptos = participantes.filter(p => p.apto).length
    const jaEmitidos = participantes.filter(p => p.certificado).length

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link href={`/cursos/turmas/${cursoId}`} className="text-xs font-black uppercase text-[#2D9E6B] hover:underline flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-3 h-3" /> Voltar para Turmas
                    </Link>
                    <h1 className="text-3xl font-black text-[#1A3C4A] flex items-center gap-3">
                        <Award className="w-8 h-8 text-[#2D9E6B]" /> Emissão de Certificados
                    </h1>
                    <p className="text-gray-500 font-medium">Turma: {curso?.titulo} • Requisito: {curso?.presenca_minima || 75}% de presença</p>
                </div>
                <button
                    onClick={handleIssueBatch}
                    disabled={issuing || totalAptos === jaEmitidos}
                    className="bg-[#1A3C4A] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50"
                >
                    {issuing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Emitir Certificados em Lote ({totalAptos - jaEmitidos})
                </button>
            </div>

            {/* Resumo Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Inscrições', value: participantes.length, icon: FileText, color: 'text-blue-500' },
                    { label: 'Encontros Totais', value: participantes[0]?.totalEncontros || 0, icon: AlertCircle, color: 'text-orange-500' },
                    { label: 'Alunos Aptos', value: totalAptos, icon: CheckCircle2, color: 'text-green-500' },
                    { label: 'Certificados Emitidos', value: jaEmitidos, icon: Award, color: 'text-[#2D9E6B]' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <stat.icon className={clsx("w-6 h-6 mb-3", stat.color)} />
                        <p className="text-[10px] font-black uppercase text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-black text-[#1A3C4A]">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabela de Participantes */}
            <div className="bg-white rounded-[40px] border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400">Aluno</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400">Presenças ({participantes[0]?.totalEncontros || 0})</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400 text-center">Desempenho</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase text-gray-400">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {participantes.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50/50 transition-all">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#1A3C4A] text-xs">
                                            {p.users.nome[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1A3C4A] text-sm">{p.users.nome}</p>
                                            <p className="text-[10px] text-gray-400 font-mono italic">{p.users.whatsapp}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-sm font-bold text-gray-700">
                                    {p.presencas_count} de {p.totalEncontros}
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={clsx("h-full transition-all", p.apto ? "bg-[#2D9E6B]" : "bg-red-400")}
                                                style={{ width: `${p.percentual}%` }}
                                            ></div>
                                        </div>
                                        <span className={clsx("text-[10px] font-black", p.apto ? "text-[#2D9E6B]" : "text-red-500")}>
                                            {p.percentual}%
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    {p.certificado ? (
                                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-black uppercase">
                                            Emitido: {p.certificado.codigo_validacao}
                                        </span>
                                    ) : (
                                        <span className={clsx(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                                            p.apto ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                                        )}>
                                            {p.apto ? 'Aguardando Emissão' : 'Inelegível'}
                                        </span>
                                    )}
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex gap-2">
                                        {p.certificado && (
                                            <>
                                                <Link
                                                    href={`/api/certificados/${p.certificado.id}?preview=true`}
                                                    target="_blank"
                                                    className="p-2 bg-gray-50 text-blue-600 rounded-xl hover:bg-blue-50 transition-all border border-gray-100"
                                                    title="Visualizar Certificado"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Link>
                                                <Link
                                                    href={`/api/certificados/${p.certificado.id}`}
                                                    target="_blank"
                                                    className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all border border-gray-100"
                                                    title="Download PDF"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </Link>
                                            </>
                                        )}
                                        <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:text-green-600 transition-all border border-gray-100">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-center text-xs text-gray-400 mt-10">
                Os certificados são gerados seguindo o modelo oficial da ONG e contém QR Code para validação pública instantânea.
            </p>
        </div>
    )
}
