'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Upload, Download, RefreshCw, Paperclip, Save } from 'lucide-react'

// ─── tipos ────────────────────────────────────────────────────────────────────

type Campo = { id?: string; label: string; tipo: string; valor: string }
type Secao = {
    id: string
    label: string
    tipo: 'textarea' | 'text' | 'number' | 'group' | 'table' | 'list'
    descricao?: string
    valor?: any
    campos?: Campo[]
    colunas?: string[]
}

// ─── seções padrão por categoria ──────────────────────────────────────────────

const SECOES_PADRAO: Record<string, Secao[]> = {
    projeto_basico: [
        { id: '1', label: 'Identificação do Projeto', tipo: 'group', campos: [
            { label: 'Entidade / Organização', tipo: 'text', valor: '' },
            { label: 'Responsável pelo Projeto', tipo: 'text', valor: '' },
            { label: 'Data de Elaboração', tipo: 'date', valor: '' },
            { label: 'Município / UF', tipo: 'text', valor: '' },
        ]},
        { id: '2', label: 'Justificativa', tipo: 'textarea', valor: '' },
        { id: '3', label: 'Objetivo Geral', tipo: 'textarea', valor: '' },
        { id: '4', label: 'Objetivos Específicos', tipo: 'list', valor: [''] },
        { id: '5', label: 'Metodologia', tipo: 'textarea', valor: '' },
        { id: '6', label: 'Público-alvo', tipo: 'textarea', valor: '' },
        { id: '7', label: 'Cronograma de Execução', tipo: 'table',
            colunas: ['Atividade', 'Mês / Período', 'Responsável'],
            valor: [['', '', '']] },
        { id: '8', label: 'Orçamento Estimado', tipo: 'table',
            colunas: ['Item', 'Qtde', 'Unit. (R$)', 'Total (R$)'],
            valor: [['', '', '', '']] },
    ],
    relatorio_parcial: [
        { id: '1', label: 'Período de Referência', tipo: 'group', campos: [
            { label: 'De', tipo: 'date', valor: '' },
            { label: 'Até', tipo: 'date', valor: '' },
        ]},
        { id: '2', label: 'Atividades Realizadas', tipo: 'textarea', valor: '' },
        { id: '3', label: 'Metas Alcançadas', tipo: 'list', valor: [''] },
        { id: '4', label: 'Beneficiários Atendidos', tipo: 'number', valor: '' },
        { id: '5', label: 'Dificuldades Encontradas', tipo: 'textarea', valor: '' },
        { id: '6', label: 'Próximas Ações Previstas', tipo: 'list', valor: [''] },
    ],
    relatorio_final: [
        { id: '1', label: 'Período de Execução', tipo: 'group', campos: [
            { label: 'Início', tipo: 'date', valor: '' },
            { label: 'Encerramento', tipo: 'date', valor: '' },
        ]},
        { id: '2', label: 'Resultados Alcançados', tipo: 'textarea', valor: '' },
        { id: '3', label: 'Metas Cumpridas', tipo: 'list', valor: [''] },
        { id: '4', label: 'Total de Beneficiários Atendidos', tipo: 'number', valor: '' },
        { id: '5', label: 'Impacto Social Observado', tipo: 'textarea', valor: '' },
        { id: '6', label: 'Lições Aprendidas', tipo: 'textarea', valor: '' },
        { id: '7', label: 'Considerações Finais', tipo: 'textarea', valor: '' },
    ],
    prestacao_contas: [
        { id: '1', label: 'Período de Referência', tipo: 'group', campos: [
            { label: 'De', tipo: 'date', valor: '' },
            { label: 'Até', tipo: 'date', valor: '' },
        ]},
        { id: '2', label: 'Receitas', tipo: 'table',
            colunas: ['Fonte de Recurso', 'Previsto (R$)', 'Recebido (R$)'],
            valor: [['', '', '']] },
        { id: '3', label: 'Despesas', tipo: 'table',
            colunas: ['Item', 'Qtde', 'Unit. (R$)', 'Total (R$)'],
            valor: [['', '', '', '']] },
        { id: '4', label: 'Saldo (R$)', tipo: 'number', valor: '' },
        { id: '5', label: 'Observações Financeiras', tipo: 'textarea', valor: '' },
    ],
    ata_reuniao: [
        { id: '1', label: 'Informações da Reunião', tipo: 'group', campos: [
            { label: 'Data', tipo: 'date', valor: '' },
            { label: 'Horário', tipo: 'text', valor: '' },
            { label: 'Local', tipo: 'text', valor: '' },
        ]},
        { id: '2', label: 'Participantes', tipo: 'list', valor: [''] },
        { id: '3', label: 'Pauta', tipo: 'list', valor: [''] },
        { id: '4', label: 'Deliberações', tipo: 'textarea', valor: '' },
        { id: '5', label: 'Encaminhamentos', tipo: 'list', valor: [''] },
    ],
    contrato: [
        { id: '1', label: 'Partes Envolvidas', tipo: 'group', campos: [
            { label: 'Contratante', tipo: 'text', valor: '' },
            { label: 'Contratado', tipo: 'text', valor: '' },
        ]},
        { id: '2', label: 'Objeto do Contrato', tipo: 'textarea', valor: '' },
        { id: '3', label: 'Valor e Forma de Pagamento', tipo: 'group', campos: [
            { label: 'Valor Total (R$)', tipo: 'number', valor: '' },
            { label: 'Forma de Pagamento', tipo: 'text', valor: '' },
        ]},
        { id: '4', label: 'Vigência', tipo: 'group', campos: [
            { label: 'Início', tipo: 'date', valor: '' },
            { label: 'Término', tipo: 'date', valor: '' },
        ]},
        { id: '5', label: 'Cláusulas Especiais', tipo: 'textarea', valor: '' },
    ],
    outro: [
        { id: '1', label: 'Conteúdo', tipo: 'textarea', valor: '' },
    ],
    plano_trabalho: [
        { id: '1', label: 'Descrição', tipo: 'textarea', valor: '' },
        { id: '2', label: 'Objetivos', tipo: 'textarea', valor: '' },
        { id: '3', label: 'Justificativa', tipo: 'textarea', valor: '' },
        { id: '4', label: 'Metas', tipo: 'list', valor: [''] },
        { id: '5', label: 'Cronograma Físico', tipo: 'table',
            colunas: ['Atividade', 'Mês', 'Responsável'],
            valor: [['', '', '']] },
        { id: '6', label: 'Orçamento Estimado (R$)', tipo: 'number', valor: '' },
    ],
}

// ─── helpers de tabela ────────────────────────────────────────────────────────

function getFinancialCols(colunas: string[]) {
    const c = colunas.map(s => s.toLowerCase())
    const qtdeIdx = c.findIndex(s => s.includes('qtde') || s.includes('qtd') || s.includes('quantidade'))
    const unitIdx = c.findIndex(s => s.includes('unit'))
    const totalIdx = c.findLastIndex(s => s.includes('total'))
    if (qtdeIdx >= 0 && unitIdx >= 0 && totalIdx >= 0) return { qtdeIdx, unitIdx, totalIdx }
    return null
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function DocumentoPage() {
    const { id: projetoId, docId } = useParams<{ id: string; docId: string }>()
    const supabase = createClient()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [saved, setSaved] = useState(false)

    const [projeto, setProjeto] = useState<{ nome: string } | null>(null)
    const [doc, setDoc] = useState<any>(null)
    const [secoes, setSecoes] = useState<Secao[]>([])
    const [titulo, setTitulo] = useState('')
    const [arquivoUrl, setArquivoUrl] = useState<string | null>(null)

    // ── carregamento ──────────────────────────────────────────────────────────

    useEffect(() => {
        const load = async () => {
            const [{ data: proj }, { data: documento }] = await Promise.all([
                supabase.from('projetos').select('nome').eq('id', projetoId).single(),
                supabase.from('projeto_documentos').select('*').eq('id', docId).single(),
            ])

            setProjeto(proj)
            setDoc(documento)
            setTitulo(documento?.titulo || '')
            setArquivoUrl(documento?.arquivo_url || null)

            // Carrega conteúdo salvo ou seções padrão da categoria
            const conteudoSalvo = documento?.conteudo
            if (Array.isArray(conteudoSalvo) && conteudoSalvo.length > 0) {
                setSecoes(conteudoSalvo)
            } else {
                setSecoes(SECOES_PADRAO[documento?.categoria] ?? SECOES_PADRAO.outro)
            }

            setLoading(false)
        }
        load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projetoId, docId])

    // ── atualização de seções ─────────────────────────────────────────────────

    const updateSecao = (idx: number, valor: any) => {
        setSecoes(prev => { const s = [...prev]; s[idx] = { ...s[idx], valor }; return s })
    }

    const updateCampoGrupo = (secaoIdx: number, campoIdx: number, valor: string) => {
        setSecoes(prev => {
            const s = [...prev]
            const campos = [...(s[secaoIdx].campos || [])]
            campos[campoIdx] = { ...campos[campoIdx], valor }
            s[secaoIdx] = { ...s[secaoIdx], campos }
            return s
        })
    }

    const updateTableCell = (secaoIdx: number, rowIdx: number, colIdx: number, value: string) => {
        setSecoes(prev => {
            const s = [...prev]
            const rows = (s[secaoIdx].valor || []).map((r: string[]) => [...r])
            rows[rowIdx][colIdx] = value
            const fin = getFinancialCols(s[secaoIdx].colunas || [])
            if (fin && (colIdx === fin.qtdeIdx || colIdx === fin.unitIdx)) {
                const qtde = parseFloat(colIdx === fin.qtdeIdx ? value : rows[rowIdx][fin.qtdeIdx]) || 0
                const unit = parseFloat(colIdx === fin.unitIdx ? value : rows[rowIdx][fin.unitIdx]) || 0
                rows[rowIdx][fin.totalIdx] = qtde * unit > 0 ? (qtde * unit).toFixed(2) : ''
            }
            s[secaoIdx] = { ...s[secaoIdx], valor: rows }
            return s
        })
    }

    const addTableRow = (secaoIdx: number) => {
        setSecoes(prev => {
            const s = [...prev]
            const cols = s[secaoIdx].colunas?.length || 1
            s[secaoIdx] = { ...s[secaoIdx], valor: [...(s[secaoIdx].valor || []), Array(cols).fill('')] }
            return s
        })
    }

    const removeTableRow = (secaoIdx: number, rowIdx: number) => {
        setSecoes(prev => {
            const s = [...prev]
            s[secaoIdx] = { ...s[secaoIdx], valor: s[secaoIdx].valor.filter((_: any, i: number) => i !== rowIdx) }
            return s
        })
    }

    // ── salvar ────────────────────────────────────────────────────────────────

    const handleSave = async (statusOverride?: string) => {
        setSaving(true)
        const novoStatus = statusOverride || doc?.status || 'rascunho'
        await supabase
            .from('projeto_documentos')
            .update({
                titulo,
                conteudo: secoes,
                status: novoStatus,
                arquivo_url: arquivoUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', docId)

        setDoc((d: any) => ({ ...d, status: novoStatus }))
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleEnviar = () => handleSave('enviado')

    // ── upload de arquivo ─────────────────────────────────────────────────────

    const handleUpload = async (file: File) => {
        setUploading(true)
        const form = new FormData()
        form.append('file', file)
        form.append('documentoId', docId)
        form.append('projetoId', projetoId)
        const res = await fetch('/api/projetos/documentos/upload', { method: 'POST', body: form })
        const data = await res.json()
        if (res.ok) setArquivoUrl(data.url)
        setUploading(false)
    }

    // ── renderização ──────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-[#2D9E6B] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    const inputCls = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B] text-sm"

    const statusColors: Record<string, string> = {
        pendente: 'bg-yellow-100 text-yellow-700',
        enviado:  'bg-blue-100 text-blue-700',
        aprovado: 'bg-green-100 text-green-700',
        rejeitado: 'bg-red-100 text-red-700',
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">

            {/* Navegação */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/projetos" className="hover:text-[#1A3C4A]">Projetos</Link>
                <span>/</span>
                <Link href={`/projetos/${projetoId}`} className="hover:text-[#1A3C4A]">{projeto?.nome}</Link>
                <span>/</span>
                <span className="text-gray-700 font-medium">{titulo}</span>
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <input
                        value={titulo}
                        onChange={e => setTitulo(e.target.value)}
                        className="text-2xl font-bold text-[#1A3C4A] bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#2D9E6B] focus:outline-none w-full transition-colors pb-0.5"
                    />
                    <span className={`mt-1 inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[doc?.status] || statusColors.pendente}`}>
                        {doc?.status === 'enviado' ? 'Enviado' : doc?.status === 'aprovado' ? 'Aprovado' : doc?.status === 'rejeitado' ? 'Rejeitado' : 'Rascunho'}
                    </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                    >
                        {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        {saved ? 'Salvo!' : 'Salvar rascunho'}
                    </button>
                    {doc?.status !== 'enviado' && doc?.status !== 'aprovado' && (
                        <button
                            onClick={handleEnviar}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#2D9E6B] text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                        >
                            Enviar para análise
                        </button>
                    )}
                </div>
            </div>

            {/* Formulário de seções */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                {secoes.map((secao, idx) => (
                    <div key={secao.id || idx} className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">{secao.label}</label>
                        {secao.descricao && <p className="text-xs text-gray-400">{secao.descricao}</p>}

                        {secao.tipo === 'textarea' && (
                            <textarea
                                value={secao.valor || ''}
                                onChange={e => updateSecao(idx, e.target.value)}
                                rows={4}
                                className={inputCls + ' resize-none'}
                            />
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

            {/* Anexo de arquivo */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Arquivo Anexado</h3>
                {arquivoUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <Paperclip className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <a href={arquivoUrl} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-green-700 font-medium hover:underline flex-1 truncate">
                            {arquivoUrl.split('/').pop()?.split('?')[0] || 'Ver arquivo'}
                        </a>
                        <a href={arquivoUrl} download target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                            <Download className="w-3.5 h-3.5" /> Baixar
                        </a>
                        <button onClick={() => setArquivoUrl(null)} className="text-xs text-gray-400 hover:text-red-500">remover</button>
                    </div>
                ) : (
                    <p className="text-xs text-gray-400 mb-2">Nenhum arquivo anexado.</p>
                )}
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-[#2D9E6B] hover:text-[#2D9E6B] transition-colors disabled:opacity-50"
                >
                    {uploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {arquivoUrl ? 'Substituir arquivo' : 'Anexar arquivo'}
                </button>
            </div>

            {/* Ações rodapé */}
            <div className="flex items-center justify-between pt-2">
                <Link href={`/projetos/${projetoId}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A3C4A]">
                    <ArrowLeft className="w-4 h-4" /> Voltar ao projeto
                </Link>
                <div className="flex gap-2">
                    <button onClick={() => handleSave()} disabled={saving} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50">
                        {saving ? 'Salvando...' : 'Salvar rascunho'}
                    </button>
                    {doc?.status !== 'enviado' && doc?.status !== 'aprovado' && (
                        <button onClick={handleEnviar} disabled={saving} className="px-4 py-2 text-sm bg-[#2D9E6B] text-white rounded-md hover:bg-green-600 disabled:opacity-50">
                            Enviar para análise
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
