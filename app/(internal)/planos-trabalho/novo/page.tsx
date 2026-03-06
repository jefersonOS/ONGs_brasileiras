'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Plus, Trash2, X } from 'lucide-react'

function NovoPlanoForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    // Data States
    const [projetos, setProjetos] = useState<{ id: string; nome: string }[]>([])

    // Form States
    const [projetoId, setProjetoId] = useState('')
    const [titulo, setTitulo] = useState('')
    const [descricao, setDescricao] = useState('')
    const [objetivos, setObjetivos] = useState('')
    const [justificativa, setJustificativa] = useState('')
    const [orcamento, setOrcamento] = useState<number | ''>('')

    // Dynamic Arrays
    const [metas, setMetas] = useState<{ nome: string, descricao: string }[]>([{ nome: '', descricao: '' }])
    const [cronograma, setCronograma] = useState<{ mes: string, atividade: string }[]>([{ mes: '1', atividade: '' }])

    // UI States
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isAIGenerated, setIsAIGenerated] = useState(false)

    // AI Modal States
    const [showAIModal, setShowAIModal] = useState(false)
    const [ideiaCentral, setIdeiaCentral] = useState('')
    const [generating, setGenerating] = useState(false)

    // Refine Field States
    const [refiningField, setRefiningField] = useState<{ name: string; value: string; setter: (v: string) => void } | null>(null)
    const [isRefining, setIsRefining] = useState(false)

    useEffect(() => {
        supabase.from('projetos').select('id, nome').eq('status', 'ativo').then(({ data }) => {
            if (data) setProjetos(data)
        })

        if (searchParams.get('ai') === 'true') {
            setShowAIModal(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleCreate = async (e: React.FormEvent, isDraft: boolean) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()

        const { error: insertError } = await supabase.from('planos_trabalho').insert({
            tenant_id: user?.user_metadata?.tenant_id,
            projeto_id: projetoId || null,
            criador_id: user?.id,
            titulo,
            descricao,
            objetivos,
            justificativa,
            metas,
            cronograma,
            orcamento_estimado: Number(orcamento) || 0,
            status: isDraft ? 'rascunho' : 'enviado',
            gerado_por_ia: isAIGenerated
        })

        if (insertError) {
            setError(insertError.message)
            setLoading(false)
            return
        }

        router.push('/planos-trabalho')
        router.refresh()
    }

    const handleAI = async () => {
        if (!ideiaCentral) return
        setGenerating(true)
        try {
            const res = await fetch('/api/ia/gerar-plano', {
                method: 'POST',
                body: JSON.stringify({ ideiaCentral })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            // Populate
            setTitulo(data.titulo || '')
            setDescricao(data.descricao || '')
            setObjetivos(data.objetivos || '')
            setJustificativa(data.justificativa || '')
            if (data.metas && Array.isArray(data.metas)) {
                setMetas(data.metas.map((m: any) => ({ nome: m.indicador || 'Meta', descricao: m.descricao })))
            }
            if (data.cronograma && Array.isArray(data.cronograma)) {
                setCronograma(data.cronograma.map((c: any) => ({ mes: c.inicio || '1', atividade: c.atividades || c.fase })))
            }
            setOrcamento(data.orcamento_estimado || '')

            setIsAIGenerated(true)
            setShowAIModal(false)
        } catch (err: unknown) {
            alert("Erro ao gerar com IA: " + (err instanceof Error ? err.message : String(err)))
        } finally {
            setGenerating(false)
        }
    }

    const handleRefineField = async () => {
        if (!refiningField) return
        setIsRefining(true)
        try {
            const res = await fetch('/api/ia/refinar-campo', {
                method: 'POST',
                body: JSON.stringify({
                    campo: refiningField.name,
                    valorAtual: refiningField.value,
                    contexto: ideiaCentral || titulo
                })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            refiningField.setter(data.refinado)
            setRefiningField(null)
        } catch (err: any) {
            alert("Erro ao refinar: " + err.message)
        } finally {
            setIsRefining(false)
        }
    }

    const RefineButton = ({ fieldName, value, setter }: { fieldName: string, value: string, setter: (v: string) => void }) => (
        <button
            type="button"
            onClick={() => setRefiningField({ name: fieldName, value, setter })}
            className="p-1 text-gray-400 hover:text-[#2D9E6B] transition-colors"
            title="Refinar com IA"
        >
            <Sparkles className="w-3.5 h-3.5" />
        </button>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Plano de Trabalho</h1>
                    <p className="text-gray-500 mt-1">Crie um novo plano detalhado para um projeto.</p>
                </div>
                <button
                    onClick={() => setShowAIModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1A3C4A] text-white rounded-md hover:bg-[#2E6B7A] transition-colors shadow-sm"
                >
                    <Sparkles className="w-4 h-4 text-[#2D9E6B]" /> Gerar com IA
                </button>
            </div>

            {isAIGenerated && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-3 text-amber-800 animate-pulse">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <p className="text-sm font-medium">Plano gerado pela IA — revise todos os campos antes de enviar para análise.</p>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {error && <div className="p-3 mb-6 bg-red-100 text-red-600 rounded-md text-sm">{error}</div>}

                <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">Título *</label>
                                <RefineButton fieldName="Título" value={titulo} setter={setTitulo} />
                            </div>
                            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Projeto Vinculado</label>
                            <select value={projetoId} onChange={e => setProjetoId(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]">
                                <option value="">Selecione um projeto...</option>
                                {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Descrição</label>
                                    <RefineButton fieldName="Descrição" value={descricao} setter={setDescricao} />
                                </div>
                                <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"></textarea>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Objetivos</label>
                                    <RefineButton fieldName="Objetivos" value={objetivos} setter={setObjetivos} />
                                </div>
                                <textarea value={objetivos} onChange={e => setObjetivos(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"></textarea>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Justificativa</label>
                                    <RefineButton fieldName="Justificativa" value={justificativa} setter={setJustificativa} />
                                </div>
                                <textarea value={justificativa} onChange={e => setJustificativa(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento Estimado (R$)</label>
                                <input type="number" step="0.01" value={orcamento} onChange={e => setOrcamento(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Metas */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Metas do Plano</label>
                                    <button type="button" onClick={() => setMetas([...metas, { nome: '', descricao: '' }])} className="text-xs text-[#2D9E6B] font-medium hover:text-green-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar Meta</button>
                                </div>
                                <div className="space-y-3">
                                    {metas.map((m, i) => (
                                        <div key={i} className="flex gap-2 items-start bg-gray-50 p-2 rounded-md border border-gray-100">
                                            <div className="flex-1 space-y-2">
                                                <input type="text" placeholder="Nome da meta" value={m.nome} onChange={e => { const nm = [...metas]; nm[i].nome = e.target.value; setMetas(nm); }} className="w-full text-sm px-2 py-1 border border-gray-200 rounded" />
                                                <input type="text" placeholder="Descrição" value={m.descricao} onChange={e => { const nm = [...metas]; nm[i].descricao = e.target.value; setMetas(nm); }} className="w-full text-xs px-2 py-1 border border-gray-200 rounded text-gray-500" />
                                            </div>
                                            <button type="button" onClick={() => setMetas(metas.filter((_, idx) => idx !== i))} className="mt-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Cronograma */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Cronograma Físico</label>
                                    <button type="button" onClick={() => setCronograma([...cronograma, { mes: (cronograma.length + 1).toString(), atividade: '' }])} className="text-xs text-[#2D9E6B] font-medium hover:text-green-700 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar Etapa</button>
                                </div>
                                <div className="space-y-3">
                                    {cronograma.map((c, i) => (
                                        <div key={i} className="flex gap-2 items-start bg-gray-50 p-2 rounded-md border border-gray-100">
                                            <input type="text" placeholder="Mês (ex: 1, ou Jan/24)" value={c.mes} onChange={e => { const nc = [...cronograma]; nc[i].mes = e.target.value; setCronograma(nc); }} className="w-24 text-sm px-2 py-1 border border-gray-200 rounded" />
                                            <input type="text" placeholder="Atividade" value={c.atividade} onChange={e => { const nc = [...cronograma]; nc[i].atividade = e.target.value; setCronograma(nc); }} className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded" />
                                            <button type="button" onClick={() => setCronograma(cronograma.filter((_, idx) => idx !== i))} className="mt-1 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 flex items-center justify-end gap-3">
                        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                        <button type="button" onClick={(e) => handleCreate(e, true)} disabled={loading} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50">
                            Salvar Rascunho
                        </button>
                        <button type="button" onClick={(e) => handleCreate(e, false)} disabled={loading} className="px-4 py-2 text-sm bg-[#2D9E6B] text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50">
                            Enviar para Análise
                        </button>
                    </div>
                </form>
            </div>

            {/* Modal IA Gerar Plano */}
            {showAIModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#F5F7F8]">
                            <h3 className="font-semibold text-[#1A3C4A] flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#2D9E6B]" /> Gerador de Planos IA
                            </h3>
                            <button onClick={() => setShowAIModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">Descreva em uma frase o objetivo principal do projeto. A IA estruturará título, justificativa, metas e cronograma automaticamente.</p>
                            <textarea
                                autoFocus
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B] text-sm"
                                placeholder="Ex: Projeto de reforço escolar e informática para crianças carentes..."
                                value={ideiaCentral}
                                onChange={e => setIdeiaCentral(e.target.value)}
                            ></textarea>

                            {generating && (
                                <div className="flex flex-col items-center justify-center py-4 space-y-3 animate-pulse">
                                    <div className="w-8 h-8 border-4 border-[#2D9E6B] border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-[#2D9E6B] font-medium text-sm">A IA está escrevendo seu plano...</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                            <button onClick={() => setShowAIModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md bg-white">Cancelar</button>
                            <button
                                onClick={handleAI}
                                disabled={generating || !ideiaCentral.trim()}
                                className="px-4 py-2 text-sm bg-[#1A3C4A] text-white rounded-md hover:bg-[#2E6B7A] flex items-center gap-2 disabled:opacity-50 shadow-sm"
                            >
                                <Sparkles className="w-4 h-4" /> {generating ? 'Gerando...' : 'Gerar Plano Completo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Refinar Campo */}
            {refiningField && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#F5F7F8]">
                            <h3 className="font-semibold text-[#1A3C4A] flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#2D9E6B]" /> Refinar {refiningField.name}
                            </h3>
                            <button onClick={() => setRefiningField(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">A IA irá reescrever este campo para torná-lo mais profissional e adequado às normas.</p>
                            <div className="p-3 bg-gray-50 rounded border border-gray-100 text-xs text-gray-500 italic mb-4 max-h-32 overflow-y-auto">
                                &quot;{refiningField.value || '(vazio)'}&quot;
                            </div>
                            {isRefining && (
                                <div className="flex items-center gap-2 text-[#2D9E6B] font-medium text-xs mb-4">
                                    <div className="w-3 h-3 border-2 border-[#2D9E6B] border-t-transparent rounded-full animate-spin"></div>
                                    Reescrevendo...
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                            <button onClick={() => setRefiningField(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md bg-white">Cancelar</button>
                            <button
                                onClick={handleRefineField}
                                disabled={isRefining}
                                className="px-4 py-2 text-sm bg-[#2D9E6B] text-white rounded-md hover:bg-green-600 flex items-center gap-2 disabled:opacity-50 shadow-sm"
                            >
                                <Sparkles className="w-4 h-4" /> {isRefining ? 'Reescrevendo...' : 'Reescrever Campo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function NovoPlanoTrabalhoPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-[#2D9E6B] border-t-transparent rounded-full"></div>
            </div>
        }>
            <NovoPlanoForm />
        </Suspense>
    )
}
