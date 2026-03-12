'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, FileText, Plus, Trash2,
    Clock, CheckCircle, XCircle, Send, Paperclip,
    Sparkles, LayoutTemplate, BookMarked, Upload, X, RefreshCw,
    ClipboardList, Receipt, ExternalLink, Calendar
} from 'lucide-react'

interface Projeto {
    id: string
    nome: string
    descricao: string
    status: string
    created_at: string
}

interface Documento {
    id: string
    titulo: string
    descricao: string | null
    categoria: string
    arquivo_url: string | null
    status: string
    observacao: string | null
    created_at: string
}

interface PlanoTrabalho {
    id: string
    titulo: string
    descricao: string | null
    status: string
    data_inicio: string | null
    data_limite: string | null
    created_at: string
}

interface PrestacaoContas {
    id: string
    titulo: string
    periodo_mes: number | null
    periodo_ano: number | null
    status: string
    created_at: string
}

interface Template {
    id: string
    nome: string
    descricao: string | null
    secoes: any[]
}

const CATEGORIA_LABEL: Record<string, string> = {
    projeto_basico: 'Projeto Básico',
    plano_trabalho: 'Plano de Trabalho',
    relatorio_parcial: 'Relatório Parcial',
    relatorio_final: 'Relatório Final',
    prestacao_contas: 'Prestação de Contas',
    ata_reuniao: 'Ata de Reunião',
    contrato: 'Contrato',
    outro: 'Outro',
}

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: React.ReactNode }> = {
    pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3 h-3" /> },
    rascunho: { label: 'Rascunho', color: 'bg-gray-100 text-gray-600', icon: <FileText className="w-3 h-3" /> },
    enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-700', icon: <Send className="w-3 h-3" /> },
    aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
    rejeitado: { label: 'Rejeitado', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
}

function DocumentoCard({ doc, projetoId, onDelete }: {
    doc: Documento
    projetoId: string
    onDelete: (id: string) => void
}) {
    const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pendente

    return (
        <div className="relative bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#2D9E6B]/50 hover:shadow-md transition-all group">
            <Link href={`/projetos/${projetoId}/documentos/${doc.id}`} className="block p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#1A3C4A]/10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 text-[#1A3C4A]" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-[#1A3C4A]">{doc.titulo}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{CATEGORIA_LABEL[doc.categoria] || doc.categoria}</p>
                        </div>
                    </div>
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${status.color}`}>
                        {status.icon} {status.label}
                    </span>
                </div>

                {doc.descricao && (
                    <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{doc.descricao}</p>
                )}

                {doc.arquivo_url ? (
                    <div className="flex items-center gap-1.5 text-xs text-green-600">
                        <Paperclip className="w-3 h-3" />
                        <span className="truncate">{doc.arquivo_url.split('/').pop()?.split('?')[0] || 'Arquivo anexado'}</span>
                    </div>
                ) : (
                    <p className="text-xs text-gray-300 italic">Sem arquivo anexado</p>
                )}

                <p className="text-[10px] text-gray-400 mt-3">Clique para abrir o formulário</p>
            </Link>

            <button
                onClick={e => { e.preventDefault(); onDelete(doc.id) }}
                className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-400 transition-colors rounded opacity-0 group-hover:opacity-100"
                title="Remover documento"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    )
}

// ─── Modal de criação de documento ────────────────────────────────────────────

type Modo = 'branco' | 'ia' | 'template' | 'importar'

function NovoDocModal({ projetoId, tenantId, onClose, onCreated }: {
    projetoId: string
    tenantId: string
    onClose: () => void
    onCreated: (doc: Documento) => void
}) {
    const supabase = createClient()
    const router = useRouter()

    const [modo, setModo] = useState<Modo>('branco')
    const [titulo, setTitulo] = useState('')
    const [categoria, setCategoria] = useState('outro')
    const [descricao, setDescricao] = useState('')

    // IA
    const [ideiaCentral, setIdeiaCentral] = useState('')
    const [gerando, setGerando] = useState(false)
    const [erroIA, setErroIA] = useState('')

    // Template
    const [templates, setTemplates] = useState<Template[]>([])
    const [templateSelecionado, setTemplateSelecionado] = useState<Template | null>(null)
    const [salvandoTemplate, setSalvandoTemplate] = useState(false)
    const [nomeTemplate, setNomeTemplate] = useState('')
    const [showSalvarTemplate, setShowSalvarTemplate] = useState(false)

    // Importar
    const [importando, setImportando] = useState(false)
    const [erroImport, setErroImport] = useState('')
    const importFileRef = useRef<HTMLInputElement>(null)

    // Conteúdo gerado (seções)
    const [conteudoGerado, setConteudoGerado] = useState<any[] | null>(null)

    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        supabase.from('templates_plano')
            .select('id, nome, descricao, secoes')
            .order('created_at', { ascending: false })
            .then(({ data }) => setTemplates(data || []))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleGerarIA = async () => {
        if (!ideiaCentral.trim()) return
        setGerando(true)
        setErroIA('')
        try {
            const res = await fetch('/api/ia/gerar-documento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoria, titulo: titulo.trim(), ideiaCentral })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao gerar')
            setConteudoGerado(data.secoes || [])
            if (data.titulo && !titulo.trim()) setTitulo(data.titulo)
        } catch (e: any) {
            setErroIA(e.message)
        }
        setGerando(false)
    }

    const handleImportarArquivo = async (file: File) => {
        setImportando(true)
        setErroImport('')
        try {
            const form = new FormData()
            form.append('file', file)
            const res = await fetch('/api/ia/estruturar-plano', { method: 'POST', body: form })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao importar')
            setConteudoGerado(data.secoes || [])
            if (data.titulo && !titulo.trim()) setTitulo(data.titulo)
        } catch (e: any) {
            setErroImport(e.message)
        }
        setImportando(false)
    }

    const handleAplicarTemplate = (t: Template) => {
        setTemplateSelecionado(t)
        setConteudoGerado(t.secoes)
        if (!titulo.trim()) setTitulo(t.nome)
    }

    const handleSalvarTemplate = async () => {
        if (!nomeTemplate.trim() || !conteudoGerado) return
        setSalvandoTemplate(true)
        await supabase.from('templates_plano').insert({
            tenant_id: tenantId,
            nome: nomeTemplate.trim(),
            secoes: conteudoGerado
        })
        const { data } = await supabase.from('templates_plano')
            .select('id, nome, descricao, secoes')
            .order('created_at', { ascending: false })
        setTemplates(data || [])
        setNomeTemplate('')
        setShowSalvarTemplate(false)
        setSalvandoTemplate(false)
    }

    const handleCriar = async () => {
        if (!titulo.trim()) return
        setSalvando(true)

        const { data, error } = await supabase
            .from('projeto_documentos')
            .insert({
                projeto_id: projetoId,
                tenant_id: tenantId,
                titulo: titulo.trim(),
                categoria,
                descricao: descricao.trim() || null,
                conteudo: conteudoGerado || [],
                status: conteudoGerado && conteudoGerado.length > 0 ? 'rascunho' : 'pendente',
            })
            .select('*')
            .single()

        if (!error && data) {
            onCreated(data)
            router.push(`/projetos/${projetoId}/documentos/${data.id}`)
        }
        setSalvando(false)
    }

    const modosBotoes: { id: Modo, label: string, icon: React.ReactNode }[] = [
        { id: 'branco', label: 'Em branco', icon: <FileText className="w-4 h-4" /> },
        { id: 'ia', label: 'Gerar com IA', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'template', label: 'Usar template', icon: <LayoutTemplate className="w-4 h-4" /> },
        { id: 'importar', label: 'Importar PDF/DOCX', icon: <BookMarked className="w-4 h-4" /> },
    ]

    const temConteudo = conteudoGerado && conteudoGerado.length > 0

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-[#1A3C4A]">Novo documento</h2>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-5">
                    {/* Campos base */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
                            <input
                                type="text"
                                value={titulo}
                                onChange={e => setTitulo(e.target.value)}
                                placeholder="Ex: Relatório Parcial - 1º Semestre"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D9E6B]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria</label>
                            <input
                                type="text"
                                list="categorias-sugestoes"
                                value={categoria}
                                onChange={e => setCategoria(e.target.value)}
                                placeholder="Ex: Relatório Parcial, Contrato..."
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D9E6B]"
                            />
                            <datalist id="categorias-sugestoes">
                                {Object.entries(CATEGORIA_LABEL).map(([, l]) => (
                                    <option key={l} value={l} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição</label>
                            <input
                                type="text"
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                placeholder="Opcional"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D9E6B]"
                            />
                        </div>
                    </div>

                    {/* Seletor de modo */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-2">Como deseja criar?</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {modosBotoes.map(m => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => { setModo(m.id); setConteudoGerado(null); setErroIA(''); setErroImport('') }}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                                        modo === m.id
                                            ? 'border-[#2D9E6B] bg-[#2D9E6B]/8 text-[#2D9E6B]'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }`}
                                >
                                    {m.icon}
                                    {m.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Conteúdo por modo */}

                    {/* IA */}
                    {modo === 'ia' && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Descreva o projeto / ideia central</label>
                                <textarea
                                    value={ideiaCentral}
                                    onChange={e => setIdeiaCentral(e.target.value)}
                                    rows={3}
                                    placeholder="Ex: Projeto de alfabetização para adultos em comunidades rurais do nordeste, com duração de 12 meses e 200 beneficiários..."
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D9E6B] resize-none"
                                />
                            </div>
                            {erroIA && <p className="text-xs text-red-500">{erroIA}</p>}
                            <button
                                type="button"
                                onClick={handleGerarIA}
                                disabled={!ideiaCentral.trim() || gerando}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-[#2D9E6B] text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium"
                            >
                                {gerando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {gerando ? 'Gerando...' : 'Gerar com IA'}
                            </button>
                            {temConteudo && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-xs font-semibold text-green-700">✓ Conteúdo gerado — {conteudoGerado!.length} seções</p>
                                    <p className="text-xs text-green-600 mt-0.5">Clique em &quot;Criar documento&quot; para abrir o formulário preenchido.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Template */}
                    {modo === 'template' && (
                        <div className="space-y-3">
                            {templates.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                                    <LayoutTemplate className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Nenhum template salvo.</p>
                                    <p className="text-xs mt-1">Crie um documento e salve-o como template.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                    {templates.map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => handleAplicarTemplate(t)}
                                            className={`w-full text-left p-3 rounded-xl border transition-all ${
                                                templateSelecionado?.id === t.id
                                                    ? 'border-[#2D9E6B] bg-[#2D9E6B]/8'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <p className="text-sm font-medium text-gray-700">{t.nome}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {t.secoes?.length || 0} seções
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {templateSelecionado && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-xs font-semibold text-green-700">✓ Template &quot;{templateSelecionado.nome}&quot; selecionado</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Importar */}
                    {modo === 'importar' && (
                        <div className="space-y-3">
                            <input
                                ref={importFileRef}
                                type="file"
                                accept=".pdf,.docx"
                                className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleImportarArquivo(f) }}
                            />
                            <button
                                type="button"
                                onClick={() => importFileRef.current?.click()}
                                disabled={importando}
                                className="flex flex-col items-center gap-2 w-full py-8 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-[#2D9E6B] hover:text-[#2D9E6B] transition-colors disabled:opacity-50"
                            >
                                {importando
                                    ? <RefreshCw className="w-6 h-6 animate-spin" />
                                    : <Upload className="w-6 h-6" />
                                }
                                <span className="text-sm font-medium">
                                    {importando ? 'Analisando documento...' : 'Clique para selecionar PDF ou DOCX'}
                                </span>
                                <span className="text-xs text-gray-400">A IA extrai a estrutura automaticamente</span>
                            </button>
                            {erroImport && <p className="text-xs text-red-500">{erroImport}</p>}
                            {temConteudo && !importando && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-semibold text-green-700">✓ Estrutura extraída — {conteudoGerado!.length} seções</p>
                                        <p className="text-xs text-green-600 mt-0.5">Clique em &quot;Criar documento&quot; para abrir o formulário.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowSalvarTemplate(v => !v)}
                                        className="flex items-center gap-1 text-xs text-[#2D9E6B] font-medium hover:underline flex-shrink-0"
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
                                        type="button"
                                        onClick={handleSalvarTemplate}
                                        disabled={!nomeTemplate.trim() || salvandoTemplate}
                                        className="px-3 py-1.5 text-sm bg-[#1A3C4A] text-white rounded-lg hover:bg-[#2E6B7A] disabled:opacity-50"
                                    >
                                        {salvandoTemplate ? 'Salvando...' : 'Salvar'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Em branco — nenhum extra */}
                    {modo === 'branco' && (
                        <p className="text-xs text-gray-400">O documento será criado com seções padrão para a categoria selecionada.</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-100">
                    <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleCriar}
                        disabled={!titulo.trim() || salvando || (modo === 'ia' && gerando) || (modo === 'importar' && importando)}
                        className="flex items-center gap-2 px-5 py-2 text-sm bg-[#1A3C4A] text-white rounded-lg hover:bg-[#2E6B7A] disabled:opacity-50 font-medium"
                    >
                        {salvando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {salvando ? 'Criando...' : 'Criar documento'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ProjetoDetalhe() {
    const { id } = useParams<{ id: string }>()
    const supabase = createClient()

    const [projeto, setProjeto] = useState<Projeto | null>(null)
    const [documentos, setDocumentos] = useState<Documento[]>([])
    const [planos, setPlanos] = useState<PlanoTrabalho[]>([])
    const [prestacoes, setPrestacoes] = useState<PrestacaoContas[]>([])
    const [loading, setLoading] = useState(true)
    const [tenantId, setTenantId] = useState('')
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setTenantId(user?.user_metadata?.tenant_id || '')

            const [{ data: proj }, { data: docs }, { data: planosData }] = await Promise.all([
                supabase.from('projetos').select('*').eq('id', id).single(),
                supabase.from('projeto_documentos')
                    .select('*')
                    .eq('projeto_id', id)
                    .order('created_at', { ascending: true }),
                supabase.from('planos_trabalho')
                    .select('id, titulo, descricao, status, data_inicio, data_limite, created_at')
                    .eq('projeto_id', id)
                    .order('created_at', { ascending: false }),
            ])

            setProjeto(proj)
            setDocumentos(docs || [])
            setPlanos(planosData || [])

            // Buscar prestações vinculadas aos planos deste projeto
            const planoIds = (planosData || []).map((p: PlanoTrabalho) => p.id)
            if (planoIds.length > 0) {
                const { data: prestData } = await supabase
                    .from('prestacoes_contas')
                    .select('id, titulo, periodo_mes, periodo_ano, status, created_at')
                    .in('plano_id', planoIds)
                    .order('created_at', { ascending: false })
                setPrestacoes(prestData || [])
            }

            setLoading(false)
        }
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    const handleDelete = async (docId: string) => {
        await supabase.from('projeto_documentos').delete().eq('id', docId)
        setDocumentos(prev => prev.filter(d => d.id !== docId))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-[#2D9E6B] border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    if (!projeto) {
        return (
            <div className="text-center py-12 text-gray-500">
                Projeto não encontrado.
                <Link href="/projetos" className="block mt-2 text-[#2D9E6B] hover:underline">Voltar para Projetos</Link>
            </div>
        )
    }

    const pendentes = documentos.filter(d => d.status === 'pendente').length
    const enviados = documentos.filter(d => d.status === 'enviado').length
    const aprovados = documentos.filter(d => d.status === 'aprovado').length

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
            {/* Navegação */}
            <div className="flex items-center gap-3">
                <Link href="/projetos" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A3C4A] transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Projetos
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-sm text-gray-700 font-medium">{projeto.nome}</span>
            </div>

            {/* Header do projeto */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-xl font-bold text-[#1A3C4A]">{projeto.nome}</h1>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${projeto.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {projeto.status === 'ativo' ? 'Ativo' : 'Arquivado'}
                            </span>
                        </div>
                        {projeto.descricao && (
                            <p className="text-sm text-gray-500 mt-1">{projeto.descricao}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                            Criado em {new Date(projeto.created_at).toLocaleDateString('pt-BR')}
                        </p>
                    </div>
                    <div className="flex gap-3 flex-shrink-0 text-center">
                        <div className="px-3 py-2 bg-yellow-50 rounded-lg">
                            <p className="text-lg font-bold text-yellow-600">{pendentes}</p>
                            <p className="text-[10px] text-yellow-500 font-medium">Pendentes</p>
                        </div>
                        <div className="px-3 py-2 bg-blue-50 rounded-lg">
                            <p className="text-lg font-bold text-blue-600">{enviados}</p>
                            <p className="text-[10px] text-blue-500 font-medium">Enviados</p>
                        </div>
                        <div className="px-3 py-2 bg-green-50 rounded-lg">
                            <p className="text-lg font-bold text-green-600">{aprovados}</p>
                            <p className="text-[10px] text-green-500 font-medium">Aprovados</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Documentos */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-800">
                        Documentação ({documentos.length})
                    </h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#2D9E6B] text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar documento
                    </button>
                </div>

                {documentos.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum documento cadastrado.</p>
                        <button onClick={() => setShowModal(true)} className="mt-2 text-sm text-[#2D9E6B] hover:underline font-medium">
                            Adicionar o primeiro documento
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documentos.map(doc => (
                            <DocumentoCard
                                key={doc.id}
                                doc={doc}
                                projetoId={id}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Planos de Trabalho */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-[#2D9E6B]" />
                        Planos de Trabalho ({planos.length})
                    </h2>
                    <Link
                        href={`/planos-trabalho/novo?projeto_id=${id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#2D9E6B] text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Novo plano
                    </Link>
                </div>
                {planos.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        <ClipboardList className="w-9 h-9 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum plano de trabalho vinculado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {planos.map(plano => {
                            const st = STATUS_CONFIG[plano.status] || STATUS_CONFIG.pendente
                            return (
                                <Link
                                    key={plano.id}
                                    href={`/planos-trabalho/${plano.id}`}
                                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-[#2D9E6B]/50 hover:shadow-md transition-all group flex flex-col gap-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="w-9 h-9 rounded-lg bg-[#2D9E6B]/10 flex items-center justify-center flex-shrink-0">
                                            <ClipboardList className="w-4 h-4 text-[#2D9E6B]" />
                                        </div>
                                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${st.color}`}>
                                            {st.icon} {st.label}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-[#1A3C4A]">{plano.titulo}</p>
                                        {plano.descricao && (
                                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{plano.descricao}</p>
                                        )}
                                    </div>
                                    {(plano.data_inicio || plano.data_limite) && (
                                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {plano.data_inicio && new Date(plano.data_inicio).toLocaleDateString('pt-BR')}
                                            {plano.data_inicio && plano.data_limite && ' → '}
                                            {plano.data_limite && new Date(plano.data_limite).toLocaleDateString('pt-BR')}
                                        </p>
                                    )}
                                    <p className="text-[10px] text-[#2D9E6B] flex items-center gap-1 font-medium">
                                        <ExternalLink className="w-3 h-3" /> Abrir plano
                                    </p>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Prestações de Contas */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-[#1A3C4A]" />
                        Prestações de Contas ({prestacoes.length})
                    </h2>
                    <Link
                        href={`/prestacoes-contas/nova?projeto_id=${id}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#1A3C4A] text-white rounded-lg hover:bg-[#2E6B7A] transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Nova prestação
                    </Link>
                </div>
                {prestacoes.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        <Receipt className="w-9 h-9 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhuma prestação de contas registrada.</p>
                        {planos.length === 0 && (
                            <p className="text-xs mt-1">Crie um plano de trabalho primeiro para vincular prestações.</p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {prestacoes.map(prest => {
                            const st = STATUS_CONFIG[prest.status] || STATUS_CONFIG.pendente
                            const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
                            const periodo = prest.periodo_mes && prest.periodo_ano
                                ? `${meses[(prest.periodo_mes - 1) % 12]} / ${prest.periodo_ano}`
                                : null
                            return (
                                <Link
                                    key={prest.id}
                                    href={`/prestacoes-contas/${prest.id}`}
                                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-[#1A3C4A]/30 hover:shadow-md transition-all group flex flex-col gap-3"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="w-9 h-9 rounded-lg bg-[#1A3C4A]/10 flex items-center justify-center flex-shrink-0">
                                            <Receipt className="w-4 h-4 text-[#1A3C4A]" />
                                        </div>
                                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${st.color}`}>
                                            {st.icon} {st.label}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 text-sm leading-tight group-hover:text-[#1A3C4A]">{prest.titulo}</p>
                                        {periodo && (
                                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> {periodo}
                                            </p>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-[#1A3C4A] flex items-center gap-1 font-medium">
                                        <ExternalLink className="w-3 h-3" /> Abrir prestação
                                    </p>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <NovoDocModal
                    projetoId={id}
                    tenantId={tenantId}
                    onClose={() => setShowModal(false)}
                    onCreated={doc => setDocumentos(prev => [...prev, doc])}
                />
            )}
        </div>
    )
}
