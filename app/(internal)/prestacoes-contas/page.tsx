import { createClient } from '@/lib/supabase/server'
import { FileText, Plus, Sparkles, Filter, ChevronRight, FileCheck, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function PrestacoesContasPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: prestacoes } = await supabase
        .from('prestacoes_contas')
        .select('*, planos_trabalho(titulo), users(nome)')
        .order('created_at', { ascending: false })

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'aprovado': return 'bg-green-50 text-green-600 border-green-100'
            case 'analise': return 'bg-blue-50 text-blue-600 border-blue-100'
            case 'rejeitado': return 'bg-red-50 text-red-600 border-red-100'
            default: return 'bg-gray-50 text-gray-500 border-gray-100'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'aprovado': return FileCheck
            case 'analise': return Clock
            case 'rejeitado': return AlertCircle
            default: return FileText
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-4xl font-black text-[#1A3C4A] tracking-tighter">Prestações de Contas</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[var(--secondary)]"></span> Transparência e Rigor Financeiro
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#1A3C4A] shadow-xl shadow-black/5 hover:bg-gray-50 transition-all flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" /> Gerar com IA
                    </button>
                    <Link
                        href="/prestacoes-contas/nova"
                        className="px-8 py-4 bg-[#1A3C4A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4 text-[var(--secondary)]" /> Nova Prestação
                    </Link>
                </div>
            </div>

            {/* Filtros Ativos (Visual Only) */}
            <div className="flex items-center gap-3 bg-white p-4 rounded-[24px] border border-gray-50 shadow-sm">
                <div className="p-2 bg-gray-50 rounded-xl">
                    <Filter className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex gap-2">
                    {['Todos', 'Rascunho', 'Em Análise', 'Aprovados'].map((f, i) => (
                        <button key={i} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${i === 0 ? 'bg-[#1A3C4A] text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabela de Prestações */}
            <div className="bg-white rounded-[40px] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                                <th className="px-8 py-6 text-gray-500">Documento / Período</th>
                                <th className="px-8 py-6">Vínculo (Plano)</th>
                                <th className="px-8 py-6">Status</th>
                                <th className="px-8 py-6">Criado por</th>
                                <th className="px-8 py-6 text-right">Ver</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {prestacoes?.map(p => {
                                const Icon = getStatusIcon(p.status)
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110 ${getStatusStyle(p.status)}`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-[#1A3C4A] text-lg leading-tight">{p.titulo}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{p.periodo}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase bg-gray-50 px-3 py-1 rounded-full text-gray-500">
                                                {p.planos_trabalho?.titulo || 'Sem Vínculo'}
                                            </div>
                                        </td>
                                        <td className="px-8 py-8">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(p.status)}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-8">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black">{p.users?.nome?.[0] || 'U'}</div>
                                                <span className="text-[10px] font-bold text-gray-400">{p.users?.nome || 'IA Bot'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-8 text-right">
                                            <Link
                                                href={`/prestacoes-contas/${p.id}`}
                                                className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-[var(--primary)] hover:text-white transition-all inline-block"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                            {!prestacoes || prestacoes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="max-w-xs mx-auto space-y-4">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                                <FileText className="w-8 h-8" />
                                            </div>
                                            <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Nenhuma prestação encontrada</p>
                                            <Link href="/prestacoes-contas/nova" className="text-[var(--primary)] font-black uppercase text-[10px] border-b-2 border-[var(--secondary)] hover:opacity-70">Começar Agora</Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
