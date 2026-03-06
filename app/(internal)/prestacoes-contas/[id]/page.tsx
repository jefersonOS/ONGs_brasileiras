'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    FileText, ArrowLeft,
    MessageSquare, DollarSign, Download, Calendar,
    User, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react'
import Link from 'next/link'


export default function DetalhePrestacaoPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { id } = params

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [prestacao, setPrestacao] = useState<any>(null)
    const [parecerText, setParecerText] = useState('')

    const fetchData = useCallback(async () => {
        const { data } = await supabase
            .from('prestacoes_contas')
            .select('*, planos_trabalho(titulo), users(nome), prestacoes_itens(*), prestacoes_pareceres(*, users(nome))')
            .eq('id', id)
            .single()

        if (data) {
            setPrestacao(data)
            // Sort pareceres by date
            data.prestacoes_pareceres.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        }
        setLoading(false)
    }, [id, supabase])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleReview = async (newStatus: string) => {
        setSaving(true)
        try {
            const res = await fetch('/api/prestacoes-contas/revisar', {
                method: 'POST',
                body: JSON.stringify({ prestacaoId: id, status: newStatus, parecer: parecerText })
            })
            if (!res.ok) throw new Error('Erro ao processar revisão')

            alert('Ação realizada com sucesso!')
            setParecerText('')
            fetchData()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase text-xs">Carregando relatório...</div>
    if (!prestacao) return <div className="p-20 text-center text-red-500 font-black uppercase text-xs tracking-widest">Prestação não encontrada</div>

    const receitas = prestacao.prestacoes_itens.filter((i: any) => i.tipo === 'receita')
    const despesas = prestacao.prestacoes_itens.filter((i: any) => i.tipo === 'despesa')
    const totalReceitas = receitas.reduce((acc: number, curr: any) => acc + curr.valor, 0)
    const totalDespesas = despesas.reduce((acc: number, curr: any) => acc + curr.valor, 0)
    const saldo = totalReceitas - totalDespesas

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Nav & Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <Link href="/prestacoes-contas" className="text-xs font-black uppercase text-[#2D9E6B] hover:underline flex items-center gap-1 mb-4 transition-all">
                        <ArrowLeft className="w-3 h-3" /> Voltar para Prestações
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-3xl bg-[#1A3C4A] text-white flex items-center justify-center shadow-2xl">
                            <FileText className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-[#1A3C4A] tracking-tighter italic leading-none">{prestacao.titulo}</h1>
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                                <Calendar className="w-3 h-3" /> Período: {prestacao.periodo} • <User className="w-3 h-3" /> Por: {prestacao.users?.nome}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 self-end md:self-auto">
                    <button className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#1A3C4A] shadow-xl shadow-black/5 hover:bg-gray-50 flex items-center gap-2 transition-all">
                        <Download className="w-4 h-4" /> Exportar PDF
                    </button>
                    {prestacao.status === 'analise' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleReview('rejeitado')}
                                disabled={saving}
                                className="px-6 py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                            >
                                Rejeitar
                            </button>
                            <button
                                onClick={() => handleReview('aprovado')}
                                disabled={saving}
                                className="px-6 py-4 bg-[var(--secondary)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[var(--secondary)]/20 hover:scale-105 transition-all disabled:opacity-50"
                            >
                                {saving ? 'Processando...' : 'Aprovar Prestação'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm flex flex-col justify-between h-40">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center"><Clock className="w-5 h-5" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Status Atual</p>
                        <p className="text-xl font-black text-[#1A3C4A] capitalize">{prestacao.status}</p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm flex flex-col justify-between h-40">
                    <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center"><ArrowUpRight className="w-5 h-5" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Receitas</p>
                        <p className="text-xl font-black text-green-600">R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm flex flex-col justify-between h-40">
                    <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center"><ArrowDownRight className="w-5 h-5" /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Despesas</p>
                        <p className="text-xl font-black text-red-600">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
                <div className="bg-[#1A3C4A] p-8 rounded-[40px] text-white flex flex-col justify-between h-40 shadow-2xl shadow-blue-900/20">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 text-[var(--secondary)] flex items-center justify-center font-bold tracking-tighter">R$</div>
                    <div>
                        <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">Saldo do Período</p>
                        <p className="text-xl font-black">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            {/* Content Tabs (Simplified to Sections) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* List of Items */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Receitas Table */}
                    <div className="bg-white rounded-[40px] border border-gray-50 overflow-hidden shadow-sm">
                        <div className="px-8 py-6 bg-gray-50/50 flex justify-between items-center border-b border-gray-50">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A] flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-500" /> Detalhamento de Receitas
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {receitas.map((i: any) => (
                                <div key={i.id} className="px-8 py-6 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-[#1A3C4A] text-sm">{i.descricao}</p>
                                        <p className="text-[10px] font-black uppercase text-gray-400 mt-0.5">{i.categoria}</p>
                                    </div>
                                    <p className="font-black text-green-600 text-sm">R$ {i.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Despesas Table */}
                    <div className="bg-white rounded-[40px] border border-gray-50 overflow-hidden shadow-sm">
                        <div className="px-8 py-6 bg-gray-50/50 flex justify-between items-center border-b border-gray-50">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A] flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-red-500" /> Detalhamento de Despesas
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {despesas.map((i: any) => (
                                <div key={i.id} className="px-8 py-6 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group cursor-pointer hover:bg-red-50 hover:text-red-500 transition-all">
                                            <Download className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#1A3C4A] text-sm">{i.descricao}</p>
                                            <p className="text-[10px] font-black uppercase text-gray-400 mt-0.5">{i.categoria}</p>
                                        </div>
                                    </div>
                                    <p className="font-black text-red-600 text-sm">R$ {i.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Reviews/History */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A] flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[var(--secondary)]" /> Histórico de Pareceres
                        </h3>
                        <div className="space-y-6">
                            {prestacao.prestacoes_pareceres?.map((p: any) => (
                                <div key={p.id} className="relative pl-6 border-l-2 border-gray-100 py-2">
                                    <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-gray-300"></div>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-[10px] font-black uppercase text-gray-400">{p.users?.nome}</p>
                                        <p className="text-[8px] text-gray-400 tracking-widest">{new Date(p.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <p className="text-xs text-gray-600 font-medium italic">&quot;{p.texto}&quot;</p>
                                </div>
                            ))}
                            {(!prestacao.prestacoes_pareceres || prestacao.prestacoes_pareceres.length === 0) && (
                                <p className="text-[10px] text-gray-400 italic">Nenhum parecer registrado até o momento.</p>
                            )}
                        </div>

                        {/* Adicionar Parecer (Form) */}
                        <div className="pt-6 border-t border-gray-50 space-y-3">
                            <textarea
                                value={parecerText}
                                onChange={e => setParecerText(e.target.value)}
                                placeholder="Adicionar um parecer técnico..."
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-[var(--secondary)]/20 min-h-[100px]"
                            ></textarea>
                            <button
                                onClick={() => handleReview(prestacao.status)}
                                disabled={saving || !parecerText}
                                className="w-full py-3 bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#1A3C4A] rounded-2xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                            >
                                {saving ? 'Salvando...' : 'Registrar Comentário'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-[32px] space-y-2">
                        <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Plano de Trabalho</p>
                        <p className="text-sm font-bold text-[#1A3C4A] italic underline hover:opacity-70 cursor-pointer">
                            {prestacao.planos_trabalho?.titulo}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
