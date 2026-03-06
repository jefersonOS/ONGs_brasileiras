'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, History, User, Bot, Clock, ChevronDown } from 'lucide-react'

export default function LogsAuditoriaPage() {
    const supabase = createClient()
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Filtros
    const [busca, setBusca] = useState('')
    const [filtroEntidade, setFiltroEntidade] = useState('')
    const [entidades, setEntidades] = useState<string[]>([])

    const fetchLogs = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            setLoading(false)
            return
        }

        const { data, error } = await supabase
            .from('audit_logs')
            .select(`
                *,
                users!user_id (nome, email)
            `)
            .eq('tenant_id', user.user_metadata?.tenant_id)
            .order('created_at', { ascending: false })
            .limit(100)

        if (error) {
            console.error(error)
        }

        if (data) {
            setLogs(data)
            const uniqueEntidades = Array.from(new Set(data.map(l => l.entidade).filter(Boolean)))
            setEntidades(uniqueEntidades as string[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchLogs()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filteredLogs = logs.filter(log => {
        const matchBusca =
            log.acao?.toLowerCase().includes(busca.toLowerCase()) ||
            log.users?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
            log.users?.email?.toLowerCase().includes(busca.toLowerCase())

        const matchEntidade = filtroEntidade === '' || log.entidade === filtroEntidade

        return matchBusca && matchEntidade
    })

    const getAcaoColor = (acao: string) => {
        const map: Record<string, string> = {
            'CREATE': 'bg-green-100 text-green-700 border-green-200',
            'UPDATE': 'bg-blue-100 text-blue-700 border-blue-200',
            'DELETE': 'bg-red-100 text-red-700 border-red-200',
            'LOGIN': 'bg-purple-100 text-purple-700 border-purple-200',
            'EXPORT': 'bg-orange-100 text-orange-700 border-orange-200'
        }
        return map[acao.toUpperCase()] || 'bg-gray-100 text-gray-700 border-gray-200'
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl font-bold text-[#1A3C4A]">Logs de Auditoria</h1>
                <p className="text-gray-500 mt-1">Histórico completo de modificações e rastreabilidade no sistema.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por usuário, e-mail ou ação..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        className="pl-9 pr-4 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-[#2D9E6B] text-sm"
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={filtroEntidade}
                        onChange={e => setFiltroEntidade(e.target.value)}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-[#2D9E6B] text-sm text-gray-700 min-w-[200px]"
                    >
                        <option value="">Todas as Entidades</option>
                        {entidades.map(ent => (
                            <option key={ent} value={ent}>{ent.toUpperCase()}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                <th className="p-4 pl-6">Data / Hora</th>
                                <th className="p-4">Ação</th>
                                <th className="p-4">Entidade</th>
                                <th className="p-4">Responsável</th>
                                <th className="p-4">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm align-middle">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center">
                                        <div className="animate-spin w-8 h-8 border-4 border-[#2D9E6B] border-t-transparent rounded-full mx-auto"></div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-500">
                                        <History className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p className="font-medium text-gray-600">Nenhum evento registrado no momento.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 pl-6 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                <span>{new Date(log.created_at).toLocaleDateString()}</span>
                                                <span className="text-gray-400 text-xs">{new Date(log.created_at).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border ${getAcaoColor(log.acao)}`}>
                                                {log.acao.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-700 font-medium whitespace-nowrap">
                                            {log.entidade}
                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 max-w-[120px] truncate" title={log.entidade_id}>
                                                {log.entidade_id ? log.entidade_id.split('-')[0] : ''}
                                            </p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                {log.gerado_por_ia ? (
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                                                        <Bot className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-teal-50 text-[#2E6B7A] flex items-center justify-center flex-shrink-0">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-800 text-sm">
                                                        {log.gerado_por_ia ? 'Agente de IA' : (log.users?.nome || 'Sistema')}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {log.gerado_por_ia ? log.modelo_ia : (log.users?.email || 'N/A')}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="relative group inline-block">
                                                <button className="flex items-center gap-1 text-xs font-semibold text-[#2E6B7A] bg-teal-50 px-3 py-1.5 rounded hover:bg-teal-100 transition-colors">
                                                    Ver Dados <ChevronDown className="w-3 h-3" />
                                                </button>
                                                {/* Tooltip Payload Hover */}
                                                <div className="absolute right-0 top-full mt-2 w-72 bg-gray-800 text-green-400 p-3 rounded-lg text-xs font-mono shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 whitespace-pre-wrap max-h-60 overflow-y-auto border border-gray-700">
                                                    <div className="mb-2 pb-2 border-b border-gray-700 text-gray-400">Payload Before:</div>
                                                    {JSON.stringify(log.dados_antes || {}, null, 2)}

                                                    <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">Payload After:</div>
                                                    {log.dados_depois ? JSON.stringify(log.dados_depois, null, 2) : 'null'}
                                                </div>
                                            </div>
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
