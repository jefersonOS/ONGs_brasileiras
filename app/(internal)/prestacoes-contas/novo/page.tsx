'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'

export default function NovaPrestacaoContasPage() {
    const router = useRouter()
    const supabase = createClient()

    // Data States
    const [planos, setPlanos] = useState<{ id: string; titulo: string }[]>([])

    // Form States
    const [planoId, setPlanoId] = useState('')
    const [titulo, setTitulo] = useState('')
    const [periodoMes, setPeriodoMes] = useState(new Date().getMonth() + 1)
    const [periodoAno, setPeriodoAno] = useState(new Date().getFullYear())

    // Dynamic Arrays (itens de receita/despesa)
    const [itens, setItens] = useState<{ descricao: string, valor: number, tipo: 'receita' | 'despesa', data: string }[]>([
        { descricao: '', valor: 0, tipo: 'despesa', data: '' }
    ])

    // UI States
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Fetch Planos para vincular
        supabase.from('planos_trabalho').select('id, titulo').in('status', ['aprovado']).then(({ data }) => {
            if (data) setPlanos(data)
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleCreate = async (e: React.FormEvent, isDraft: boolean) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()

        const { error: insertError } = await supabase.from('prestacoes_contas').insert({
            tenant_id: user?.user_metadata?.tenant_id,
            plano_id: planoId || null,
            criador_id: user?.id,
            titulo,
            periodo_mes: periodoMes,
            periodo_ano: periodoAno,
            itens,
            status: isDraft ? 'rascunho' : 'enviado',
            gerado_por_ia: false
        })

        if (insertError) {
            setError(insertError.message)
            setLoading(false)
            return
        }

        router.push('/prestacoes-contas')
        router.refresh()
    }

    const valorTotalReceitas = itens.filter(i => i.tipo === 'receita').reduce((acc, curr) => acc + curr.valor, 0)
    const valorTotalDespesas = itens.filter(i => i.tipo === 'despesa').reduce((acc, curr) => acc + curr.valor, 0)
    const saldo = valorTotalReceitas - valorTotalDespesas

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-[#1A3C4A]">Nova Prestação de Contas</h1>
                <p className="text-gray-500 mt-1">Envie o balanço mensal e comprovantes vinculados a um plano de trabalho.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {error && <div className="p-3 mb-6 bg-red-100 text-red-600 rounded-md text-sm">{error}</div>}

                <form className="space-y-8">
                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título do Relatório *</label>
                            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" placeholder="Ex: Relatório Financeiro Janeiro/2024" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plano de Trabalho Vinculado</label>
                            <select value={planoId} onChange={e => setPlanoId(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]">
                                <option value="">Selecione um plano aprovado...</option>
                                {planos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mês Ref.</label>
                                <input type="number" min="1" max="12" value={periodoMes} onChange={e => setPeriodoMes(Number(e.target.value))} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ano Ref.</label>
                                <input type="number" min="2000" max="2100" value={periodoAno} onChange={e => setPeriodoAno(Number(e.target.value))} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Lançamentos Financeiros */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Lançamentos Financeiros</h3>
                            <button type="button" onClick={() => setItens([...itens, { descricao: '', valor: 0, tipo: 'despesa', data: '' }])} className="text-sm px-3 py-1.5 bg-[#F5F7F8] text-[#1A3C4A] font-medium border border-gray-200 hover:bg-gray-100 rounded-md flex items-center gap-1 transition-colors">
                                <Plus className="w-4 h-4" /> Adicionar Lançamento
                            </button>
                        </div>

                        <div className="space-y-4">
                            {itens.map((item, i) => (
                                <div key={i} className="flex flex-col md:flex-row gap-3 items-start bg-gray-50 p-4 rounded-md border border-gray-200">
                                    <div className="w-full md:w-32">
                                        <select value={item.tipo} onChange={e => { const ni = [...itens]; ni[i].tipo = e.target.value as 'receita' | 'despesa'; setItens(ni) }} className="w-full text-sm px-2 py-2 border bg-white border-gray-300 rounded focus:ring-[#2D9E6B]">
                                            <option value="despesa">Despesa</option>
                                            <option value="receita">Receita</option>
                                        </select>
                                    </div>
                                    <div className="w-full md:w-auto">
                                        <input type="date" value={item.data} onChange={e => { const ni = [...itens]; ni[i].data = e.target.value; setItens(ni) }} className="w-full text-sm px-2 py-2 bg-white border border-gray-300 rounded focus:ring-[#2D9E6B]" />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <input type="text" placeholder="Descrição (ex: Compra de materiais escolares)" value={item.descricao} onChange={e => { const ni = [...itens]; ni[i].descricao = e.target.value; setItens(ni) }} className="w-full text-sm px-3 py-2 bg-white border border-gray-300 rounded focus:ring-[#2D9E6B]" />
                                    </div>
                                    <div className="w-full md:w-32 relative">
                                        <span className="absolute left-3 top-2 text-gray-500 text-sm">R$</span>
                                        <input type="number" step="0.01" value={item.valor} onChange={e => { const ni = [...itens]; ni[i].valor = Number(e.target.value); setItens(ni) }} className="w-full text-sm pl-8 pr-2 py-2 bg-white border border-gray-300 rounded focus:ring-[#2D9E6B]" />
                                    </div>
                                    <button type="button" onClick={() => setItens(itens.filter((_, idx) => idx !== i))} className="mt-2 md:mt-1.5 text-gray-400 hover:text-red-500 bg-white p-1.5 rounded-md border border-gray-200 hover:border-red-200 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Totais */}
                        <div className="mt-6 flex justify-end">
                            <div className="bg-[#F5F7F8] border border-gray-200 rounded-lg p-4 w-full md:w-64 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total Receitas:</span>
                                    <span className="text-green-600 font-medium">R$ {valorTotalReceitas.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total Despesas:</span>
                                    <span className="text-red-600 font-medium">R$ {valorTotalDespesas.toFixed(2)}</span>
                                </div>
                                <div className="pt-2 border-t border-gray-200 flex justify-between">
                                    <span className="font-bold text-gray-800">Saldo:</span>
                                    <span className={`font-bold ${saldo >= 0 ? 'text-[#2D9E6B]' : 'text-red-600'}`}>R$ {saldo.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 flex items-center justify-end gap-3">
                        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                        <button type="button" onClick={(e) => handleCreate(e, true)} disabled={loading} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50">
                            Salvar Rascunho
                        </button>
                        <button type="button" onClick={(e) => handleCreate(e, false)} disabled={loading} className="px-4 py-2 text-sm bg-[#1A3C4A] text-white rounded-md hover:bg-[#2E6B7A] transition-colors disabled:opacity-50">
                            Enviar Relatório
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
