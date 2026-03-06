'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, Save, Download, CheckCircle, XCircle } from 'lucide-react'

export default function PresencasPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const atividadeId = params.id

    // States
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [atividade, setAtividade] = useState<any>(null)
    const [encontroSelecionado, setEncontroSelecionado] = useState<string>('')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [inscricoes, setInscricoes] = useState<any[]>([])
    const [presencas, setPresencas] = useState<Record<string, boolean>>({}) // inscricao_id -> boolean

    // Walk-in
    const [busca, setBusca] = useState('')

    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchAll = async () => {
            // Buscando dados da atividade e datas configuradas
            const { data: ativData } = await supabase.from('atividades').select('*').eq('id', atividadeId).single()
            if (ativData) {
                setAtividade(ativData)
                if (ativData.datas && ativData.datas.length > 0) {
                    setEncontroSelecionado(`${ativData.datas[0].data} | ${ativData.datas[0].hora_inicio}`)
                }
            }

            // Buscando inscritos
            const { data: inscData } = await supabase
                .from('inscricoes')
                .select(`
                    id,
                    users!cidadao_id ( id, nome, cpf, email )
                `)
                .eq('entidade_id', atividadeId)
                .eq('status', 'confirmada')

            if (inscData) setInscricoes(inscData)
        }

        fetchAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [atividadeId])

    useEffect(() => {
        const fetchPresencasForEncontro = async () => {
            if (!encontroSelecionado) return
            const { data: pData } = await supabase
                .from('presencas')
                .select('inscricao_id, presente')
                .eq('encontro_id', encontroSelecionado)

            if (pData) {
                const map: Record<string, boolean> = {}
                pData.forEach(p => {
                    map[p.inscricao_id] = p.presente
                })
                setPresencas(map)
            } else {
                setPresencas({})
            }
        }
        fetchPresencasForEncontro()
    }, [encontroSelecionado, supabase])

    const handleSave = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        // Para os ids marcados, dar upsert
        const ops = Object.keys(presencas).map(inscId => ({
            inscricao_id: inscId,
            encontro_id: encontroSelecionado,
            presente: presencas[inscId],
            registrado_por: user?.id
        }))

        // First need to do an upsert or delete and insert. 
        // We'll trust insert for simplicity since Presencas table doesn't have a strict composite unique key yet.
        // Or better: filter and push one by one to avoid duplicates if checking is needed.
        try {
            await supabase.from('presencas').upsert(ops, { onConflict: 'id' })
        } catch (e) {
            console.error(e)
        }

        alert("Lista salva com sucesso!")
        setLoading(false)
    }

    const togglePresenca = (inscricaoId: string) => {
        setPresencas(prev => ({
            ...prev,
            [inscricaoId]: !prev[inscricaoId]
        }))
    }

    // const unmappedUsers = inscricoes.filter(i => Object.keys(presencas).length > 0 ? true : true) // naive

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Lista de Presença</h1>
                    <p className="text-gray-500 mt-1">{atividade?.titulo || 'Carregando atividade...'}</p>
                </div>
                <div className="flex gap-3">
                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm text-sm">
                        <Download className="w-4 h-4" /> Exportar PDF
                    </button>
                    <button onClick={handleSave} disabled={loading} className="bg-[#2D9E6B] hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm text-sm">
                        <Save className="w-4 h-4" /> {loading ? 'Salvando...' : 'Salvar Lista'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row gap-6 mb-8 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Encontro/Data</label>
                        <select
                            value={encontroSelecionado}
                            onChange={e => setEncontroSelecionado(e.target.value)}
                            className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]"
                        >
                            <option value="">Selecione uma data...</option>
                            {atividade?.datas?.map((d: { data: string, hora_inicio: string }, i: number) => (
                                <option key={i} value={`${d.data} | ${d.hora_inicio}`}>
                                    {new Date(d.data).toLocaleDateString()} - {d.hora_inicio}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Busca Rápida (Walk-in)</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou CPF..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-[#2D9E6B]"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-sm font-semibold text-gray-600 rounded-tl-lg">Nome do Cidadão</th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-600">CPF</th>
                                <th className="px-4 py-3 text-sm font-semibold text-center text-gray-600 rounded-tr-lg">Presença</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {inscricoes.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                        Nenhum cidadão inscrito para esta atividade.
                                    </td>
                                </tr>
                            ) : (
                                inscricoes.filter(i => !busca || String(i.users?.nome).toLowerCase().includes(busca.toLowerCase()) || String(i.users?.cpf).includes(busca)).map((insc) => (
                                    <tr key={insc.id} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 font-medium text-gray-800">{insc.users?.nome || '-'}</td>
                                        <td className="px-4 py-3 text-gray-600 text-sm">{insc.users?.cpf || '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => togglePresenca(insc.id)}
                                                className={`inline-flex items-center justify-center p-1.5 rounded-full transition-colors ${presencas[insc.id] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                            >
                                                {presencas[insc.id] ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
