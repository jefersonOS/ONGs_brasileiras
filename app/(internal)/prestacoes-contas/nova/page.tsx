'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Send, Upload, DollarSign, Calculator, ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NovaPrestacaoPage() {
    const supabase = createClient()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [planos, setPlanos] = useState<any[]>([])

    // Cabeçalho
    const [planoId, setPlanoId] = useState('')
    const [titulo, setTitulo] = useState('')
    const [periodo, setPeriodo] = useState('')

    const handleGerarIA = async () => {
        if (!planoId) return alert('Selecione um plano primeiro para que a IA tenha contexto.')
        setGenerating(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const res = await fetch('/api/ia/gerar-prestacao', {
                method: 'POST',
                body: JSON.stringify({ planoId, tenantId: user?.user_metadata?.tenant_id })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setTitulo(data.titulo)
            setReceitas(data.receitas.map((r: any) => ({ ...r, id: Math.random().toString() })))
            setDespesas(data.despesas.map((d: any) => ({ ...d, id: Math.random().toString() })))
        } catch (error: any) {
            alert('Erro na IA: ' + error.message)
        } finally {
            setGenerating(false)
        }
    }

    // Itens
    const [receitas, setReceitas] = useState<{ id: string, categoria: string, descricao: string, valor: number }[]>([
        { id: Math.random().toString(), categoria: '', descricao: '', valor: 0 }
    ])
    const [despesas, setDespesas] = useState<{ id: string, categoria: string, descricao: string, valor: number, comprovante?: string }[]>([
        { id: Math.random().toString(), categoria: '', descricao: '', valor: 0 }
    ])

    useEffect(() => {
        const fetchPlanos = async () => {
            const { data } = await supabase
                .from('planos_trabalho')
                .select('id, titulo')
                .eq('status', 'aprovado')
            if (data) setPlanos(data)
            setLoading(false)
        }
        fetchPlanos()
    }, [supabase])

    const totalReceitas = receitas.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
    const totalDespesas = despesas.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
    const saldo = totalReceitas - totalDespesas

    const addReceita = () => setReceitas([...receitas, { id: Math.random().toString(), categoria: '', descricao: '', valor: 0 }])
    const removeReceita = (id: string) => setReceitas(receitas.filter(r => r.id !== id))

    const addDespesa = () => setDespesas([...despesas, { id: Math.random().toString(), categoria: '', descricao: '', valor: 0 }])
    const removeDespesa = (id: string) => setDespesas(despesas.filter(d => d.id !== id))

    const handleSave = async (status: 'rascunho' | 'analise') => {
        if (!planoId || !titulo || !periodo) return alert('Preencha os campos obrigatórios.')

        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Criar Prestação
            const { data: prestacao, error: pError } = await supabase
                .from('prestacoes_contas')
                .insert({
                    tenant_id: user?.user_metadata?.tenant_id,
                    plano_id: planoId,
                    titulo,
                    periodo,
                    status,
                    criado_por: user?.id
                })
                .select()
                .single()

            if (pError) throw pError

            // 2. Inserir Itens
            const itensItems = [
                ...receitas.map(r => ({ prestacao_id: prestacao.id, tipo: 'receita', categoria: r.categoria, descricao: r.descricao, valor: r.valor })),
                ...despesas.map(d => ({ prestacao_id: prestacao.id, tipo: 'despesa', categoria: d.categoria, descricao: d.descricao, valor: d.valor, comprovante_url: d.comprovante }))
            ]

            const { error: iError } = await supabase.from('prestacoes_itens').insert(itensItems)
            if (iError) throw iError

            alert(status === 'rascunho' ? 'Rascunho salvo!' : 'Prestação enviada para análise!')
            router.push('/prestacoes-contas')
        } catch (error: any) {
            alert('Erro ao salvar: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center animate-pulse">Carregando dados...</div>

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <Link href="/prestacoes-contas" className="text-xs font-black uppercase text-[#2D9E6B] hover:underline flex items-center gap-1 mb-4">
                        <ArrowLeft className="w-3 h-3" /> Voltar para Listagem
                    </Link>
                    <h1 className="text-3xl font-black text-[#1A3C4A] tracking-tighter">Nova Prestação de Contas</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Registre suas movimentações financeiras para análise</p>
                </div>
                <button
                    onClick={handleGerarIA}
                    disabled={generating || !planoId}
                    className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#1A3C4A] shadow-xl shadow-black/5 hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-purple-500" />}
                    Preencher com IA
                </button>
            </div>

            {/* Dados Básicos */}
            <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-50 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Plano de Trabalho Vinculado</label>
                    <select value={planoId} onChange={e => setPlanoId(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[var(--secondary)]/20">
                        <option value="">Selecione um plano aprovado</option>
                        {planos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                    </select>
                </div>
                <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Título da Prestação</label>
                    <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Prestação Mensal Janeiro/2026" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold" />
                </div>
                <div className="w-40 space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Período (MM/AAAA)</label>
                    <input type="text" value={periodo} onChange={e => setPeriodo(e.target.value)} placeholder="01/2026" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold text-center" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Receitas */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-[#1A3C4A] flex items-center gap-3 italic">
                            <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
                            Receitas
                        </h2>
                        <button onClick={addReceita} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all"><Plus className="w-4 h-4" /></button>
                    </div>
                    {receitas.map((r, i) => (
                        <div key={r.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex gap-4">
                                <input type="text" placeholder="Categoria" value={r.categoria} onChange={e => {
                                    const next = [...receitas]; next[i].categoria = e.target.value; setReceitas(next);
                                }} className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold border-none" />
                                <input type="number" placeholder="Valor" value={r.valor} onChange={e => {
                                    const next = [...receitas]; next[i].valor = Number(e.target.value); setReceitas(next);
                                }} className="w-32 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold border-none" />
                            </div>
                            <div className="flex gap-4">
                                <input type="text" placeholder="Descrição curta" value={r.descricao} onChange={e => {
                                    const next = [...receitas]; next[i].descricao = e.target.value; setReceitas(next);
                                }} className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold border-none" />
                                <button onClick={() => removeReceita(r.id)} className="p-2 text-red-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Despesas */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-[#1A3C4A] flex items-center gap-3 italic">
                            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
                            Despesas
                        </h2>
                        <button onClick={addDespesa} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Plus className="w-4 h-4" /></button>
                    </div>
                    {despesas.map((d, i) => (
                        <div key={d.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                            <div className="flex gap-4">
                                <input type="text" placeholder="Categoria" value={d.categoria} onChange={e => {
                                    const next = [...despesas]; next[i].categoria = e.target.value; setDespesas(next);
                                }} className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold border-none" />
                                <input type="number" placeholder="Valor" value={d.valor} onChange={e => {
                                    const next = [...despesas]; next[i].valor = Number(e.target.value); setDespesas(next);
                                }} className="w-32 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold border-none" />
                            </div>
                            <div className="flex items-center gap-4">
                                <input type="text" placeholder="Descrição curta" value={d.descricao} onChange={e => {
                                    const next = [...despesas]; next[i].descricao = e.target.value; setDespesas(next);
                                }} className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold border-none" />
                                <div className="relative">
                                    <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all"><Upload className="w-4 h-4" /></button>
                                </div>
                                <button onClick={() => removeDespesa(d.id)} className="p-2 text-red-300 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="bg-[#1A3C4A] p-10 rounded-[40px] text-white shadow-2xl shadow-black/20 flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-[var(--secondary)]">
                        <Calculator className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black italic tracking-tighter">Resumo Financeiro</h3>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Cálculo em tempo real dos itens</p>
                    </div>
                </div>
                <div className="flex gap-12 text-center">
                    <div>
                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Receitas</p>
                        <p className="text-2xl font-black text-green-400">R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">Total Despesas</p>
                        <p className="text-2xl font-black text-red-400">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="px-8 border-l border-white/10">
                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">Saldo Final</p>
                        <p className={`text-2xl font-black ${saldo >= 0 ? 'text-[var(--secondary)]' : 'text-red-500'}`}>R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            {/* Ações */}
            <div className="flex justify-end gap-6 pt-10">
                <button
                    onClick={() => handleSave('rascunho')}
                    disabled={saving}
                    className="px-10 py-5 bg-white border border-gray-100 text-[#1A3C4A] rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-gray-50 transition-all shadow-xl shadow-black/5"
                >
                    Salvar Rascunho
                </button>
                <button
                    onClick={() => handleSave('analise')}
                    disabled={saving}
                    className="px-12 py-5 bg-[var(--secondary)] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:scale-105 transition-all shadow-2xl shadow-[var(--secondary)]/30 flex items-center gap-3 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Enviar para Análise</>}
                </button>
            </div>
        </div>
    )
}
