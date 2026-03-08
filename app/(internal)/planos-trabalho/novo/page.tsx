'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Plus, Trash2, X, LayoutTemplate, BookMarked } from 'lucide-react'

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

    // File Extraction States
    const [fileProcessing, setFileProcessing] = useState(false)
    const [secoesDinamicas, setSecoesDinamicas] = useState<any[] | null>(null)
    const [arquivoUrl, setArquivoUrl] = useState<string | null>(null)

    // Template States
    const [templates, setTemplates] = useState<any[]>([])
    const [showTemplateModal, setShowTemplateModal] = useState(false)
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
    const [templateNome, setTemplateNome] = useState('')
    const [templateDescricao, setTemplateDescricao] = useState('')
    const [savingTemplate, setSavingTemplate] = useState(false)

    useEffect(() => {
        supabase.from('projetos').select('id, nome').eq('status', 'ativo').then(({ data }) => {
            if (data) setProjetos(data)
        })
        supabase.from('templates_plano').select('id, nome, descricao, secoes').order('created_at', { ascending: false }).then(({ data }) => {
            if (data) setTemplates(data)
        })
        if (searchParams.get('ai') === 'true') {
            setShowAIModal(true)
        }
    }, [supabase, searchParams])

    const saveTemplate = async () => {
        if (!templateNome.trim() || !secoesDinamicas) return
        setSavingTemplate(true)
        const { data: { user } } = await supabase.auth.getUser()
        const { error } = await supabase.from('templates_plano').insert({
            tenant_id: user?.user_metadata?.tenant_id,
            nome: templateNome.trim(),
            descricao: templateDescricao.trim() || null,
            secoes: secoesDinamicas,
        })
        if (!error) {
            setShowSaveTemplateModal(false)
            setTemplateNome('')
            setTemplateDescricao('')
            // Recarrega lista
            supabase.from('templates_plano').select('id, nome, descricao, secoes').order('created_at', { ascending: false }).then(({ data }) => {
                if (data) setTemplates(data)
            })
            alert('Template salvo com sucesso!')
        } else {
            alert('Erro ao salvar template: ' + error.message)
        }
        setSavingTemplate(false)
    }

    const applyTemplate = (template: any) => {
        setSecoesDinamicas(template.secoes)
        setTitulo(template.nome)
        setIsAIGenerated(false)
        setShowTemplateModal(false)
    }

    const handleFileSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setFileProcessing(true)
        setError(null)

        try {
            // 1. Upload para o Storage (para histórico)
            const { data: { user } } = await supabase.auth.getUser()
            const fileExt = file.name.split('.').pop()
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`
            const filePath = `uploads/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('planos-trabalho')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('planos-trabalho')
                .getPublicUrl(filePath)

            setArquivoUrl(publicUrl)

            // 2. Enviar para Processamento de IA (Estruturação)
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/ia/estruturar-plano', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setTitulo(data.titulo || '')
            setSecoesDinamicas(data.secoes || [])
            setIsAIGenerated(true)

            alert('Estrutura extraída com sucesso! Agora você pode preencher os campos abaixo.')
        } catch (err: any) {
            setError('Erro ao processar arquivo: ' + err.message)
        } finally {
            setFileProcessing(false)
        }
    }

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
            descricao: secoesDinamicas ? JSON.stringify(secoesDinamicas) : descricao,
            objetivos,
            justificativa,
            metas,
            cronograma,
            orcamento_estimado: Number(orcamento) || 0,
            status: isDraft ? 'rascunho' : 'enviado',
            gerado_por_ia: isAIGenerated,
            arquivo_url: arquivoUrl,
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

    const updateSecao = (idx: number, valor: any) => {
        const updated = [...(secoesDinamicas || [])]
        updated[idx] = { ...updated[idx], valor }
        setSecoesDinamicas(updated)
    }

    const getFinancialCols = (colunas: string[]) => {
        const c = colunas.map(s => s.toLowerCase())
        const qtdeIdx = c.findIndex(s => s.includes('qtde') || s.includes('qtd') || s.includes('quantidade'))
        const unitIdx = c.findIndex(s => s.includes('unit'))
        const totalIdx = c.findLastIndex(s => s.includes('total'))
        if (qtdeIdx >= 0 && unitIdx >= 0 && totalIdx >= 0) return { qtdeIdx, unitIdx, totalIdx }
        return null
    }

    const updateTableCell = (secaoIdx: number, rowIdx: number, colIdx: number, value: string) => {
        const updated = [...(secoesDinamicas || [])]
        const rows = updated[secaoIdx].valor.map((r: string[]) => [...r])
        rows[rowIdx][colIdx] = value

        const fin = getFinancialCols(updated[secaoIdx].colunas || [])
        if (fin && (colIdx === fin.qtdeIdx || colIdx === fin.unitIdx)) {
            const qtde = parseFloat(colIdx === fin.qtdeIdx ? value : rows[rowIdx][fin.qtdeIdx]) || 0
            const unit = parseFloat(colIdx === fin.unitIdx ? value : rows[rowIdx][fin.unitIdx]) || 0
            rows[rowIdx][fin.totalIdx] = qtde * unit > 0 ? (qtde * unit).toFixed(2) : ''
        }

        updated[secaoIdx] = { ...updated[secaoIdx], valor: rows }
        setSecoesDinamicas(updated)
    }

    const addTableRow = (secaoIdx: number) => {
        const updated = [...(secoesDinamicas || [])]
        const colunas = updated[secaoIdx].colunas?.length || 1
        updated[secaoIdx] = { ...updated[secaoIdx], valor: [...(updated[secaoIdx].valor || []), Array(colunas).fill('')] }
        setSecoesDinamicas(updated)
    }

    const removeTableRow = (secaoIdx: number, rowIdx: number) => {
        const updated = [...(secoesDinamicas || [])]
        updated[secaoIdx] = { ...updated[secaoIdx], valor: updated[secaoIdx].valor.filter((_: any, i: number) => i !== rowIdx) }
        setSecoesDinamicas(updated)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Plano de Trabalho</h1>
                    <p className="text-gray-500 mt-1">Crie um novo plano detalhado para um projeto.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {templates.length > 0 && (
                        <button
                            onClick={() => setShowTemplateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors shadow-sm text-sm"
                        >
                            <LayoutTemplate className="w-4 h-4" /> Usar Template
                        </button>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2 bg-white border border-[#1A3C4A] text-[#1A3C4A] rounded-md hover:bg-gray-50 transition-colors shadow-sm cursor-pointer text-sm">
                        <Plus className="w-4 h-4" />
                        {fileProcessing ? 'Processando...' : 'Importar PDF/DOCX'}
                        <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileSelection} disabled={fileProcessing} />
                    </label>
                    <button
                        onClick={() => setShowAIModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#1A3C4A] text-white rounded-md hover:bg-[#2E6B7A] transition-colors shadow-sm text-sm"
                    >
                        <Sparkles className="w-4 h-4 text-[#2D9E6B]" /> Gerar com IA
                    </button>
                </div>
            </div>

            {isAIGenerated && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-3 text-amber-800">
                    <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-sm font-medium flex-1">Estrutura carregada — revise ou complete os campos abaixo antes de enviar.</p>
                </div>
            )}

            {secoesDinamicas !== null && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-green-800">
                        <BookMarked className="w-5 h-5 text-green-600 shrink-0" />
                        <p className="text-sm font-medium">Quer reutilizar essa estrutura no futuro? Salve como template.</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowSaveTemplateModal(true)}
                        className="shrink-0 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                        <LayoutTemplate className="w-4 h-4" /> Salvar Template
                    </button>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {error && <div className="p-3 mb-6 bg-red-100 text-red-600 rounded-md text-sm">{error}</div>}

                <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">Título do Plano *</label>
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

                    {/* Campos Dinâmicos (extraídos do arquivo) */}
                    {secoesDinamicas && secoesDinamicas.length > 0 ? (
                        <div className="space-y-6">
                            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 border-b pb-2">Estrutura Extraída do Arquivo</h2>
                            <div className="grid grid-cols-1 gap-6">
                                {secoesDinamicas.map((secao, idx) => (
                                    <div key={secao.id || idx}>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block text-sm font-medium text-gray-700">{secao.label}</label>
                                            {(secao.tipo === 'textarea' || secao.tipo === 'text') && (
                                                <RefineButton fieldName={secao.label} value={secao.valor || ''} setter={(v) => updateSecao(idx, v)} />
                                            )}
                                        </div>
                                        {secao.descricao && <p className="text-xs text-gray-400 mb-2">{secao.descricao}</p>}

                                        {secao.tipo === 'textarea' ? (
                                            <textarea
                                                value={secao.valor || ''}
                                                onChange={e => updateSecao(idx, e.target.value)}
                                                rows={4}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"
                                            />
                                        ) : secao.tipo === 'text' ? (
                                            <input
                                                type="text"
                                                value={secao.valor || ''}
                                                onChange={e => updateSecao(idx, e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"
                                            />
                                        ) : secao.tipo === 'number' ? (
                                            <input
                                                type="number"
                                                value={secao.valor || ''}
                                                onChange={e => updateSecao(idx, e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"
                                            />
                                        ) : secao.tipo === 'group' ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                                {(secao.campos || []).map((campo: any, ci: number) => (
                                                    <div key={campo.id || ci}>
                                                        <label className="block text-xs font-semibold text-gray-500 mb-1">{campo.label}</label>
                                                        {campo.tipo === 'textarea' ? (
                                                            <textarea
                                                                value={campo.valor || ''}
                                                                onChange={e => {
                                                                    const updated = [...(secoesDinamicas || [])]
                                                                    updated[idx].campos[ci].valor = e.target.value
                                                                    setSecoesDinamicas(updated)
                                                                }}
                                                                rows={3}
                                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D9E6B]"
                                                            />
                                                        ) : (
                                                            <input
                                                                type={campo.tipo === 'date' ? 'date' : campo.tipo === 'number' ? 'number' : 'text'}
                                                                value={campo.valor || ''}
                                                                onChange={e => {
                                                                    const updated = [...(secoesDinamicas || [])]
                                                                    updated[idx].campos[ci].valor = e.target.value
                                                                    setSecoesDinamicas(updated)
                                                                }}
                                                                className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D9E6B]"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : secao.tipo === 'table' ? (
                                            <div className="overflow-x-auto">
                                                {(() => {
                                                    const fin = getFinancialCols(secao.colunas || [])
                                                    const rows: string[][] = secao.valor || []
                                                    const grandTotal = fin ? rows.reduce((sum, row) => sum + (parseFloat(row[fin.totalIdx]) || 0), 0) : 0
                                                    return (
                                                        <table className="w-full text-sm border-collapse">
                                                            <thead>
                                                                <tr className="bg-gray-100">
                                                                    {(secao.colunas || []).map((col: string, ci: number) => (
                                                                        <th key={ci} className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">{col}</th>
                                                                    ))}
                                                                    <th className="border border-gray-200 px-2 py-2 w-8"></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {rows.map((row: string[], ri: number) => (
                                                                    <tr key={ri}>
                                                                        {row.map((cell: string, ci: number) => {
                                                                            const isNumeric = fin && (ci === fin.qtdeIdx || ci === fin.unitIdx)
                                                                            const isTotal = fin && ci === fin.totalIdx
                                                                            return (
                                                                                <td key={ci} className="border border-gray-200 p-1">
                                                                                    <input
                                                                                        type={isNumeric || isTotal ? 'number' : 'text'}
                                                                                        step={isNumeric || isTotal ? '0.01' : undefined}
                                                                                        readOnly={!!isTotal}
                                                                                        className={`w-full px-2 py-1 text-xs border-none focus:outline-none ${isTotal ? 'bg-gray-50 font-semibold text-right' : ''}`}
                                                                                        value={cell}
                                                                                        onChange={e => updateTableCell(idx, ri, ci, e.target.value)}
                                                                                    />
                                                                                </td>
                                                                            )
                                                                        })}
                                                                        <td className="border border-gray-200 p-1 text-center">
                                                                            <button type="button" onClick={() => removeTableRow(idx, ri)} className="text-gray-400 hover:text-red-500">
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                {fin && (
                                                                    <tr className="bg-gray-50">
                                                                        <td colSpan={fin.totalIdx} className="border border-gray-200 px-3 py-2 text-xs font-black text-right uppercase tracking-wider">TOTAL</td>
                                                                        <td className="border border-gray-200 px-2 py-2 text-xs font-black text-right">
                                                                            {grandTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                                        </td>
                                                                        <td className="border border-gray-200"></td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    )
                                                })()}
                                                <button
                                                    type="button"
                                                    onClick={() => addTableRow(idx)}
                                                    className="mt-2 text-xs text-[#2D9E6B] font-semibold flex items-center gap-1"
                                                >
                                                    <Plus className="w-3 h-3" /> Adicionar linha
                                                </button>
                                            </div>
                                        ) : secao.tipo === 'list' ? (
                                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
                                                {(Array.isArray(secao.valor) ? secao.valor : []).map((item: any, i: number) => (
                                                    <div key={i} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={typeof item === 'string' ? item : JSON.stringify(item)}
                                                            onChange={e => {
                                                                const newVal = [...secao.valor]
                                                                newVal[i] = e.target.value
                                                                updateSecao(idx, newVal)
                                                            }}
                                                            className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded"
                                                        />
                                                        <button type="button" onClick={() => updateSecao(idx, secao.valor.filter((_: any, fi: number) => fi !== i))} className="text-gray-400 hover:text-red-500">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => updateSecao(idx, [...(secao.valor || []), ''])} className="text-xs text-[#2D9E6B] font-semibold flex items-center gap-1">
                                                    <Plus className="w-3 h-3" /> Adicionar item
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
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
                    )}

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

            {/* Modal Usar Template */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#F5F7F8]">
                            <h3 className="font-semibold text-[#1A3C4A] flex items-center gap-2">
                                <LayoutTemplate className="w-4 h-4 text-[#2D9E6B]" /> Selecionar Template
                            </h3>
                            <button onClick={() => setShowTemplateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => applyTemplate(t)}
                                    className="w-full text-left flex items-center gap-4 p-4 bg-gray-50 hover:bg-[#1A3C4A]/5 rounded-lg border border-gray-100 hover:border-[#1A3C4A]/20 transition-colors"
                                >
                                    <div className="w-9 h-9 bg-[#1A3C4A]/10 rounded-lg flex items-center justify-center shrink-0">
                                        <LayoutTemplate className="w-4 h-4 text-[#1A3C4A]" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-[#1A3C4A]">{t.nome}</p>
                                        {t.descricao && <p className="text-xs text-gray-400 mt-0.5">{t.descricao}</p>}
                                        <p className="text-[10px] text-gray-300 mt-1">{t.secoes?.length || 0} seções</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                            <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md bg-white">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Salvar Template */}
            {showSaveTemplateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#F5F7F8]">
                            <h3 className="font-semibold text-[#1A3C4A] flex items-center gap-2">
                                <BookMarked className="w-4 h-4 text-[#2D9E6B]" /> Salvar como Template
                            </h3>
                            <button onClick={() => setShowSaveTemplateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Template *</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={templateNome}
                                    onChange={e => setTemplateNome(e.target.value)}
                                    placeholder="Ex: Plano de Trabalho Municipal 2025"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#2D9E6B]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                                <input
                                    type="text"
                                    value={templateDescricao}
                                    onChange={e => setTemplateDescricao(e.target.value)}
                                    placeholder="Ex: Modelo da Secretaria de Assistência Social"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#2D9E6B]"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                            <button onClick={() => setShowSaveTemplateModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md bg-white">Cancelar</button>
                            <button
                                onClick={saveTemplate}
                                disabled={savingTemplate || !templateNome.trim()}
                                className="px-4 py-2 text-sm bg-[#2D9E6B] text-white rounded-md hover:bg-green-600 flex items-center gap-2 disabled:opacity-50"
                            >
                                <BookMarked className="w-4 h-4" /> {savingTemplate ? 'Salvando...' : 'Salvar Template'}
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
