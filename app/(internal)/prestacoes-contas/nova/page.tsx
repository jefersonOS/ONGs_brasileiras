'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Plus, Trash2, Send, Sparkles, LayoutTemplate,
    BookMarked, Upload, X, RefreshCw, Save, FileText
} from 'lucide-react'

// ─── tipos ────────────────────────────────────────────────────────────────────

type Campo = { label: string; tipo: string; valor: string }
type Secao = {
    id: string
    label: string
    tipo: 'textarea' | 'text' | 'number' | 'group' | 'table' | 'list'
    descricao?: string
    valor?: any
    campos?: Campo[]
    colunas?: string[]
}

// ─── seções padrão ────────────────────────────────────────────────────────────

const SECOES_PADRAO: Secao[] = [
    { id: '1', label: 'Identificação', tipo: 'group', campos: [
        { label: 'Período de Referência', tipo: 'text', valor: '' },
        { label: 'Responsável Financeiro', tipo: 'text', valor: '' },
        { label: 'CNPJ', tipo: 'text', valor: '' },
        { label: 'Data de Elaboração', tipo: 'date', valor: '' },
    ]},
    { id: '2', label: 'Receitas', tipo: 'table',
        colunas: ['Fonte de Recurso', 'Previsto (R$)', 'Recebido (R$)', 'Observação'],
        valor: [['', '', '', '']] },
    { id: '3', label: 'Despesas', tipo: 'table',
        colunas: ['Item / Descrição', 'Qtde', 'Unit. (R$)', 'Total (R$)'],
        valor: [['', '', '', '']] },
    { id: '4', label: 'Saldo do Período (R$)', tipo: 'number', valor: '' },
    { id: '5', label: 'Observações Gerais', tipo: 'textarea', valor: '' },
]

// ─── helpers financeiros ──────────────────────────────────────────────────────

function getFinancialCols(colunas: string[]) {
    const c = colunas.map(s => s.toLowerCase())
    const qtdeIdx = c.findIndex(s => s.includes('qtde') || s.includes('qtd') || s.includes('quantidade'))
    const unitIdx = c.findIndex(s => s.includes('unit'))
    const totalIdx = c.findLastIndex(s => s.includes('total'))
    if (qtdeIdx >= 0 && unitIdx >= 0 && totalIdx >= 0) return { qtdeIdx, unitIdx, totalIdx }
    return null
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function NovaPrestacaoPage() {
    const supabase = createClient()
    const router = useRouter()
    const searchParams = useSearchParams()
    const importFileRef = useRef<HTMLInputElement>(null)

    // Header
    const [planos, setPlanos] = useState<{ id: string; titulo: string; metas?: any; cronograma?: any; orcamento_estimado?: number; objetivos?: string }[]>([])
    const [planoId, setPlanoId] = useState('')
    const [titulo, setTitulo] = useState('')
    const [periodo, setPeriodo] = useState('')

    // Seções dinâmicas
    const [secoes, setSecoes] = useState<Secao[]>(SECOES_PADRAO)

    // UI
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // IA
    const [generating, setGenerating] = useState(false)
    const [erroIA, setErroIA] = useState('')

    // Template
    const [showTemplateModal, setShowTemplateModal] = useState(false)
    const [templates, setTemplates] = useState<{ id: string; nome: string; secoes: Secao[] }[]>([])
    const [showSalvarTemplate, setShowSalvarTemplate] = useState(false)
    const [nomeTemplate, setNomeTemplate] = useState('')
    const [salvandoTemplate, setSalvandoTemplate] = useState(false)
    const [templateAplicado, setTemplateAplicado] = useState(false)

    // Importar
    const [importando, setImportando] = useState(false)
    const [erroImport, setErroImport] = useState('')

    // Extraindo do plano
    const [extraindo, setExtraindo] = useState(false)

    useEffect(() => {
        const init = async () => {
            const projetoId = searchParams.get('projeto_id')
            let planosQuery = supabase.from('planos_trabalho').select('id, titulo, metas, cronograma, orcamento_estimado, objetivos')
            if (projetoId) {
                planosQuery = planosQuery.eq('projeto_id', projetoId)
            } else {
                planosQuery = planosQuery.eq('status', 'aprovado')
            }
            const [{ data: planosData }, { data: templatesData }] = await Promise.all([
                planosQuery,
                supabase.from('templates_plano').select('id, nome, secoes').order('created_at', { ascending: false }),
            ])
            setPlanos(planosData || [])
            setTemplates(templatesData || [])
            // Pre-select single plan when coming from a project
            if (planosData?.length === 1) setPlanoId(planosData[0].id)
            setLoading(false)
        }
        init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // ── seções helpers ────────────────────────────────────────────────────────

    const updateSecao = (idx: number, valor: any) => {
        setSecoes(prev => { const s = [...prev]; s[idx] = { ...s[idx], valor }; return s })
    }

    const updateCampoGrupo = (si: number, ci: number, valor: string) => {
        setSecoes(prev => {
            const s = [...prev]
            const campos = [...(s[si].campos || [])]
            campos[ci] = { ...campos[ci], valor }
            s[si] = { ...s[si], campos }
            return s
        })
    }

    const updateTableCell = (si: number, ri: number, ci: number, value: string) => {
        setSecoes(prev => {
            const s = [...prev]
            const rows = (s[si].valor || []).map((r: string[]) => [...r])
            rows[ri][ci] = value
            const fin = getFinancialCols(s[si].colunas || [])
            if (fin && (ci === fin.qtdeIdx || ci === fin.unitIdx)) {
                const q = parseFloat(ci === fin.qtdeIdx ? value : rows[ri][fin.qtdeIdx]) || 0
                const u = parseFloat(ci === fin.unitIdx ? value : rows[ri][fin.unitIdx]) || 0
                rows[ri][fin.totalIdx] = q * u > 0 ? (q * u).toFixed(2) : ''
            }
            s[si] = { ...s[si], valor: rows }
            return s
        })
    }

    const addTableRow = (si: number) => {
        setSecoes(prev => {
            const s = [...prev]
            const cols = s[si].colunas?.length || 1
            s[si] = { ...s[si], valor: [...(s[si].valor || []), Array(cols).fill('')] }
            return s
        })
    }

    const removeTableRow = (si: number, ri: number) => {
        setSecoes(prev => {
            const s = [...prev]
            s[si] = { ...s[si], valor: s[si].valor.filter((_: any, i: number) => i !== ri) }
            return s
        })
    }

    // ── IA ────────────────────────────────────────────────────────────────────

    const handleGerarIA = async () => {
        if (!planoId) { setErroIA('Selecione um plano de trabalho para a IA ter contexto.'); return }
        setGenerating(true)
        setErroIA('')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const res = await fetch('/api/ia/gerar-prestacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planoId, tenantId: user?.user_metadata?.tenant_id })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            if (data.titulo && !titulo) setTitulo(data.titulo)

            // Converte receitas/despesas para seções de tabela
            setSecoes(prev => prev.map(s => {
                if (s.id === '2' && data.receitas?.length > 0) {
                    return { ...s, valor: data.receitas.map((r: any) => [r.categoria || '', r.descricao || '', (r.valor || 0).toFixed(2), '']) }
                }
                if (s.id === '3' && data.despesas?.length > 0) {
                    return { ...s, valor: data.despesas.map((d: any) => [d.descricao || '', '1', (d.valor || 0).toFixed(2), (d.valor || 0).toFixed(2)]) }
                }
                return s
            }))
            setTemplateAplicado(true)
        } catch (e: any) {
            setErroIA(e.message)
        }
        setGenerating(false)
    }

    // ── Extrair do plano ──────────────────────────────────────────────────────

    const handleExtrairDoPlano = async () => {
        if (!planoId) { setErroIA('Selecione um plano de trabalho primeiro.'); return }
        const plano = planos.find(p => p.id === planoId)
        if (!plano) return
        setExtraindo(true)

        // Pre-fill identificação e seções a partir do plano
        if (!titulo) setTitulo(`Prestação de Contas — ${plano.titulo}`)
        if (!periodo) setPeriodo('')

        setSecoes(prev => prev.map(s => {
            // Receitas: usar orcamento_estimado como previsto
            if (s.id === '2') {
                const rows: string[][] = []
                if (plano.orcamento_estimado) {
                    rows.push(['Recurso previsto no plano', plano.orcamento_estimado.toFixed(2), '', ''])
                }
                return { ...s, valor: rows.length > 0 ? rows : s.valor }
            }
            // Despesas: usar metas como itens
            if (s.id === '3' && Array.isArray(plano.metas) && plano.metas.length > 0) {
                const rows = plano.metas.map((m: any) => [m.nome || m.descricao || 'Meta', '1', '', ''])
                return { ...s, valor: rows }
            }
            return s
        }))

        setTemplateAplicado(true)
        setExtraindo(false)
    }

    // ── Template ──────────────────────────────────────────────────────────────

    const handleAplicarTemplate = (t: { id: string; nome: string; secoes: Secao[] }) => {
        setSecoes(t.secoes)
        if (!titulo) setTitulo(t.nome)
        setTemplateAplicado(true)
        setShowTemplateModal(false)
    }

    const handleSalvarTemplate = async () => {
        if (!nomeTemplate.trim()) return
        setSalvandoTemplate(true)
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('templates_plano').insert({
            tenant_id: user?.user_metadata?.tenant_id,
            nome: nomeTemplate.trim(),
            secoes
        })
        const { data } = await supabase.from('templates_plano').select('id, nome, secoes').order('created_at', { ascending: false })
        setTemplates(data || [])
        setNomeTemplate('')
        setShowSalvarTemplate(false)
        setSalvandoTemplate(false)
    }

    // ── Importar PDF/DOCX ─────────────────────────────────────────────────────

    const handleImportarArquivo = async (file: File) => {
        setImportando(true)
        setErroImport('')
        try {
            const form = new FormData()
            form.append('file', file)
            const res = await fetch('/api/ia/estruturar-plano', { method: 'POST', body: form })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao importar')
            setSecoes(data.secoes || [])
            if (data.titulo && !titulo) setTitulo(data.titulo)
            setTemplateAplicado(true)
        } catch (e: any) {
            setErroImport(e.message)
        }
        setImportando(false)
    }

    // ── Salvar ────────────────────────────────────────────────────────────────

    const handleSave = async (status: 'rascunho' | 'enviado') => {
        if (!titulo.trim() || !periodo.trim()) {
            alert('Preencha o Título e o Período.')
            return
        }
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const { error } = await supabase.from('prestacoes_contas').insert({
                tenant_id: user?.user_metadata?.tenant_id,
                plano_id: planoId || null,
                titulo: titulo.trim(),
                periodo,
                status,
                criador_id: user?.id,
                secoes,
                itens: [],
            })
            if (error) throw error
            router.push('/prestacoes-contas')
        } catch (e: any) {
            alert('Erro ao salvar: ' + e.message)
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-[#2D9E6B] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B] text-sm"

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">

            {/* Navegação */}
            <div className="flex items-center gap-3">
                <Link href="/prestacoes-contas" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A3C4A]">
                    <ArrowLeft className="w-4 h-4" /> Prestações de Contas
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-sm text-gray-700 font-medium">Nova Prestação</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Nova Prestação de Contas</h1>
                    <p className="text-sm text-gray-400 mt-1">Registre as movimentações financeiras do período</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => handleSave('rascunho')}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Salvar rascunho
                    </button>
                    <button
                        onClick={() => handleSave('enviado')}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#2D9E6B] text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                    >
                        <Send className="w-3.5 h-3.5" /> Enviar para análise
                    </button>
                </div>
            </div>

            {/* Dados básicos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-gray-700">Informações Gerais</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
                        <input
                            type="text"
                            value={titulo}
                            onChange={e => setTitulo(e.target.value)}
                            placeholder="Ex: Prestação de Contas — Janeiro 2026"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Período *</label>
                        <input
                            type="text"
                            value={periodo}
                            onChange={e => setPeriodo(e.target.value)}
                            placeholder="Ex: 01/2026"
                            className={inputCls}
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Plano de Trabalho vinculado</label>
                        <select
                            value={planoId}
                            onChange={e => setPlanoId(e.target.value)}
                            className={inputCls + ' bg-white'}
                        >
                            <option value="">— Nenhum (opcional) —</option>
                            {planos.map(p => <option key={p.id} value={p.id}>{p.titulo}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Ações de criação */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 space-y-3">
                <p className="text-xs font-semibold text-gray-600">Preencher seções automaticamente</p>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleGerarIA}
                        disabled={generating || !planoId}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-purple-200 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 disabled:opacity-40 font-medium transition-colors"
                    >
                        {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Gerar com IA
                    </button>
                    <button
                        onClick={() => setShowTemplateModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-blue-200 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                    >
                        <LayoutTemplate className="w-4 h-4" /> Usar template
                    </button>
                    <button
                        onClick={() => importFileRef.current?.click()}
                        disabled={importando}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-orange-200 text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 disabled:opacity-40 font-medium transition-colors"
                    >
                        {importando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BookMarked className="w-4 h-4" />}
                        Importar PDF/DOCX
                    </button>
                    <button
                        onClick={handleExtrairDoPlano}
                        disabled={extraindo || !planoId}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-green-200 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 disabled:opacity-40 font-medium transition-colors"
                    >
                        {extraindo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Extrair do plano de trabalho
                    </button>
                    <input
                        ref={importFileRef}
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImportarArquivo(f) }}
                    />
                </div>
                {erroIA && <p className="text-xs text-red-500">{erroIA}</p>}
                {erroImport && <p className="text-xs text-red-500">{erroImport}</p>}
                {templateAplicado && (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs font-semibold text-green-700">✓ Seções preenchidas automaticamente</p>
                        <button
                            onClick={() => setShowSalvarTemplate(v => !v)}
                            className="flex items-center gap-1 text-xs text-[#2D9E6B] font-medium hover:underline"
                        >
                            <BookMarked className="w-3.5 h-3.5" /> Salvar como template
                        </button>
                    </div>
                )}
                {showSalvarTemplate && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={nomeTemplate}
                            onChange={e => setNomeTemplate(e.target.value)}
                            placeholder="Nome do template"
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D9E6B]"
                        />
                        <button
                            onClick={handleSalvarTemplate}
                            disabled={!nomeTemplate.trim() || salvandoTemplate}
                            className="px-3 py-1.5 text-sm bg-[#1A3C4A] text-white rounded-lg disabled:opacity-50"
                        >
                            {salvandoTemplate ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                )}
            </div>

            {/* Formulário de seções */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                {secoes.map((secao, idx) => (
                    <div key={secao.id || idx} className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">{secao.label}</label>
                        {secao.descricao && <p className="text-xs text-gray-400">{secao.descricao}</p>}

                        {secao.tipo === 'textarea' && (
                            <textarea value={secao.valor || ''} onChange={e => updateSecao(idx, e.target.value)} rows={4} className={inputCls + ' resize-none'} />
                        )}
                        {secao.tipo === 'text' && (
                            <input type="text" value={secao.valor || ''} onChange={e => updateSecao(idx, e.target.value)} className={inputCls} />
                        )}
                        {secao.tipo === 'number' && (
                            <input type="number" value={secao.valor || ''} onChange={e => updateSecao(idx, e.target.value)} className={inputCls} />
                        )}

                        {secao.tipo === 'group' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                {(secao.campos || []).map((campo, ci) => (
                                    <div key={ci}>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">{campo.label}</label>
                                        <input
                                            type={campo.tipo === 'date' ? 'date' : campo.tipo === 'number' ? 'number' : 'text'}
                                            value={campo.valor || ''}
                                            onChange={e => updateCampoGrupo(idx, ci, e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#2D9E6B]"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {secao.tipo === 'list' && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-2">
                                {(Array.isArray(secao.valor) ? secao.valor : []).map((item: string, i: number) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={item}
                                            onChange={e => {
                                                const v = [...secao.valor]; v[i] = e.target.value; updateSecao(idx, v)
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
                        )}

                        {secao.tipo === 'table' && (() => {
                            const fin = getFinancialCols(secao.colunas || [])
                            const rows: string[][] = secao.valor || []
                            const grandTotal = fin ? rows.reduce((sum, row) => sum + (parseFloat(row[fin.totalIdx]) || 0), 0) : 0
                            return (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                {(secao.colunas || []).map((col, ci) => (
                                                    <th key={ci} className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">{col}</th>
                                                ))}
                                                <th className="border border-gray-200 px-2 py-2 w-8"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, ri) => (
                                                <tr key={ri}>
                                                    {row.map((cell, ci) => {
                                                        const isNumeric = fin && (ci === fin.qtdeIdx || ci === fin.unitIdx)
                                                        const isTotal = fin && ci === fin.totalIdx
                                                        return (
                                                            <td key={ci} className="border border-gray-200 p-1">
                                                                <input
                                                                    type={isNumeric || isTotal ? 'number' : 'text'}
                                                                    step={isNumeric || isTotal ? '0.01' : undefined}
                                                                    readOnly={!!isTotal}
                                                                    value={cell}
                                                                    onChange={e => updateTableCell(idx, ri, ci, e.target.value)}
                                                                    className={`w-full px-2 py-1 text-xs border-none focus:outline-none focus:ring-1 focus:ring-[#2D9E6B] rounded ${isTotal ? 'bg-gray-50 font-semibold text-right' : ''}`}
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
                                    <button type="button" onClick={() => addTableRow(idx)} className="mt-2 text-xs text-[#2D9E6B] font-semibold flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Adicionar linha
                                    </button>
                                </div>
                            )
                        })()}
                    </div>
                ))}
            </div>

            {/* Ações rodapé */}
            <div className="flex items-center justify-between pt-2">
                <Link href="/prestacoes-contas" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A3C4A]">
                    <ArrowLeft className="w-4 h-4" /> Cancelar
                </Link>
                <div className="flex gap-2">
                    <button onClick={() => handleSave('rascunho')} disabled={saving} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50">
                        Salvar rascunho
                    </button>
                    <button onClick={() => handleSave('enviado')} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#2D9E6B] text-white rounded-md hover:bg-green-600 disabled:opacity-50">
                        {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {saving ? 'Salvando...' : 'Enviar para análise'}
                    </button>
                </div>
            </div>

            {/* Modal templates */}
            {showTemplateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <h3 className="font-bold text-[#1A3C4A]">Selecionar template</h3>
                            <button onClick={() => setShowTemplateModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-5 space-y-2">
                            {templates.length === 0 ? (
                                <div className="text-center py-10 text-gray-400">
                                    <LayoutTemplate className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Nenhum template salvo.</p>
                                </div>
                            ) : (
                                templates.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleAplicarTemplate(t)}
                                        className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-[#2D9E6B] transition-colors"
                                    >
                                        <p className="text-sm font-medium text-gray-700">{t.nome}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{t.secoes?.length || 0} seções</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
