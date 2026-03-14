'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    FileText, ArrowLeft,
    MessageSquare, DollarSign, Download, Calendar,
    User, ArrowUpRight, ArrowDownRight, Clock, ChevronRight
} from 'lucide-react'
import Link from 'next/link'

type Secao = {
    id: string
    label: string
    tipo: 'group' | 'table' | 'textarea' | 'text' | 'number' | 'list'
    valor?: any
    colunas?: string[]
    campos?: { id: string; label: string; tipo: string; valor: string }[]
    descricao?: string
}

function getFinancialCols(colunas: string[]) {
    const colLower = colunas.map(c => c.toLowerCase())
    const totalIdx = colLower.findLastIndex(c => c.includes('total') || c.includes('r$') || c.includes('recebido'))
    const qtyIdx = colLower.findIndex(c => c.includes('qtde') || c.includes('quant'))
    const unitIdx = colLower.findIndex(c => c.includes('unit') || c.includes('unitário'))
    return { totalIdx, qtyIdx, unitIdx }
}

function computeRowTotal(row: string[], qtyIdx: number, unitIdx: number, totalIdx: number): number {
    if (qtyIdx >= 0 && unitIdx >= 0) {
        const qty = parseFloat(row[qtyIdx]?.replace(',', '.')) || 0
        const unit = parseFloat(row[unitIdx]?.replace(',', '.')) || 0
        return qty * unit
    }
    if (totalIdx >= 0) {
        return parseFloat(row[totalIdx]?.replace(',', '.')) || 0
    }
    return 0
}

function getSummaryFromSecoes(secoes: Secao[]) {
    let totalReceitas = 0
    let totalDespesas = 0
    let saldo = 0

    for (const s of secoes) {
        const labelLower = s.label.toLowerCase()
        if (s.tipo === 'table' && Array.isArray(s.valor) && s.colunas) {
            const { totalIdx, qtyIdx, unitIdx } = getFinancialCols(s.colunas)
            const sum = (s.valor as string[][]).reduce((acc, row) => acc + computeRowTotal(row, qtyIdx, unitIdx, totalIdx), 0)
            if (labelLower.includes('receita')) totalReceitas += sum
            else if (labelLower.includes('despesa')) totalDespesas += sum
        }
        if (s.tipo === 'number' && labelLower.includes('saldo')) {
            saldo = parseFloat(String(s.valor).replace(',', '.')) || 0
        }
    }

    if (saldo === 0) saldo = totalReceitas - totalDespesas
    return { totalReceitas, totalDespesas, saldo }
}

function SecaoView({ secao }: { secao: Secao }) {
    if (secao.tipo === 'group' && secao.campos) {
        return (
            <div className="bg-white rounded-[32px] border border-gray-50 p-8 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A]">{secao.label}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {secao.campos.map(c => (
                        <div key={c.id}>
                            <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1">{c.label}</p>
                            <p className="text-sm font-bold text-[#1A3C4A]">{c.valor || '—'}</p>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (secao.tipo === 'table' && secao.colunas) {
        const rows = (Array.isArray(secao.valor) ? secao.valor : []) as string[][]
        const { qtyIdx, unitIdx, totalIdx } = getFinancialCols(secao.colunas)
        const isFinancial = totalIdx >= 0
        const total = rows.reduce((acc, row) => acc + computeRowTotal(row, qtyIdx, unitIdx, totalIdx), 0)

        return (
            <div className="bg-white rounded-[32px] border border-gray-50 overflow-hidden shadow-sm">
                <div className="px-8 py-5 bg-gray-50/50 border-b border-gray-50">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A] flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[#2D9E6B]" /> {secao.label}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-gray-50">
                                {secao.colunas.map((col, i) => (
                                    <th key={i} className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-gray-400">{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {rows.filter(r => r.some(c => c)).map((row, ri) => (
                                <tr key={ri} className="hover:bg-gray-50/50 transition-colors">
                                    {secao.colunas!.map((_, ci) => (
                                        <td key={ci} className="px-6 py-4 font-medium text-[#1A3C4A]">
                                            {row[ci] || '—'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                        {isFinancial && rows.length > 0 && (
                            <tfoot>
                                <tr className="border-t-2 border-gray-100 bg-gray-50/50">
                                    <td colSpan={secao.colunas.length - 1} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Total</td>
                                    <td className="px-6 py-4 font-black text-[#1A3C4A]">
                                        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                    {rows.filter(r => r.some(c => c)).length === 0 && (
                        <p className="px-8 py-6 text-xs text-gray-400">Nenhum item registrado.</p>
                    )}
                </div>
            </div>
        )
    }

    if (secao.tipo === 'textarea') {
        return (
            <div className="bg-white rounded-[32px] border border-gray-50 p-8 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A]">{secao.label}</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{secao.valor || '—'}</p>
            </div>
        )
    }

    if (secao.tipo === 'text') {
        return (
            <div className="bg-white rounded-[32px] border border-gray-50 p-8 shadow-sm">
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">{secao.label}</p>
                <p className="text-sm font-bold text-[#1A3C4A]">{secao.valor || '—'}</p>
            </div>
        )
    }

    if (secao.tipo === 'number') {
        return (
            <div className="bg-[#1A3C4A] rounded-[32px] p-8 text-white shadow-xl">
                <p className="text-[9px] font-black uppercase opacity-50 tracking-widest mb-2">{secao.label}</p>
                <p className="text-2xl font-black">
                    R$ {(parseFloat(String(secao.valor).replace(',', '.')) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
            </div>
        )
    }

    if (secao.tipo === 'list') {
        const items = Array.isArray(secao.valor) ? secao.valor : []
        return (
            <div className="bg-white rounded-[32px] border border-gray-50 p-8 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A]">{secao.label}</h3>
                <ul className="space-y-2">
                    {items.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <ChevronRight className="w-4 h-4 text-[#2D9E6B] mt-0.5 shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        )
    }

    return null
}

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
            .select('*, planos_trabalho(titulo), users(nome)')
            .eq('id', id)
            .single()

        if (data) setPrestacao(data)
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

    const secoes: Secao[] = Array.isArray(prestacao.secoes) ? prestacao.secoes : []
    const { totalReceitas, totalDespesas, saldo } = getSummaryFromSecoes(secoes)

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
                            <h1 className="text-4xl font-black text-[#1A3C4A] tracking-tighter leading-none">{prestacao.titulo}</h1>
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
                    {prestacao.status === 'enviado' && (
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

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Sections */}
                <div className="lg:col-span-2 space-y-6">
                    {secoes.length === 0 ? (
                        <div className="bg-white rounded-[40px] border border-gray-50 p-16 text-center text-gray-400 text-xs font-bold uppercase tracking-widest shadow-sm">
                            Nenhuma seção registrada
                        </div>
                    ) : (
                        secoes.map(s => <SecaoView key={s.id} secao={s} />)
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Parecer */}
                    <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A] flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-[var(--secondary)]" /> Adicionar Parecer
                        </h3>
                        <div className="space-y-3">
                            <textarea
                                value={parecerText}
                                onChange={e => setParecerText(e.target.value)}
                                placeholder="Adicionar um parecer técnico..."
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-[var(--secondary)]/20 min-h-[100px]"
                            />
                            <button
                                onClick={() => handleReview(prestacao.status)}
                                disabled={saving || !parecerText}
                                className="w-full py-3 bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#1A3C4A] rounded-2xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                            >
                                {saving ? 'Salvando...' : 'Registrar Comentário'}
                            </button>
                        </div>
                    </div>

                    {/* Plano de Trabalho ref */}
                    {prestacao.planos_trabalho?.titulo && (
                        <div className="bg-gray-50 p-6 rounded-[32px] space-y-2">
                            <p className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Plano de Trabalho</p>
                            <p className="text-sm font-bold text-[#1A3C4A]">{prestacao.planos_trabalho.titulo}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
