'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, Upload, FileText, Download, Plus, Trash2,
    Clock, CheckCircle, XCircle, Send, RefreshCw, Paperclip
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
    enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-700', icon: <Send className="w-3 h-3" /> },
    aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-3 h-3" /> },
    rejeitado: { label: 'Rejeitado', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3 h-3" /> },
}

function DocumentoCard({ doc, projetoId, onUpdate, onDelete }: {
    doc: Documento
    projetoId: string
    onUpdate: (updated: Documento) => void
    onDelete: (id: string) => void
}) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState<string | null>(null)
    const [observacao, setObservacao] = useState(doc.observacao || '')
    const [savingObs, setSavingObs] = useState(false)
    const supabase = createClient()

    const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pendente

    const handleUpload = async (file: File) => {
        setUploading(true)
        setUploadError(null)
        try {
            const form = new FormData()
            form.append('file', file)
            form.append('documentoId', doc.id)
            form.append('projetoId', projetoId)

            const res = await fetch('/api/projetos/documentos/upload', { method: 'POST', body: form })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            onUpdate({ ...doc, arquivo_url: data.url, status: 'enviado' })
        } catch (e: any) {
            setUploadError(e.message || 'Erro ao enviar arquivo')
        } finally {
            setUploading(false)
        }
    }

    const handleSaveObservacao = async () => {
        setSavingObs(true)
        await supabase
            .from('projeto_documentos')
            .update({ observacao, updated_at: new Date().toISOString() })
            .eq('id', doc.id)
        setSavingObs(false)
        onUpdate({ ...doc, observacao })
    }

    const handleRemoveArquivo = async () => {
        await supabase
            .from('projeto_documentos')
            .update({ arquivo_url: null, status: 'pendente', updated_at: new Date().toISOString() })
            .eq('id', doc.id)
        onUpdate({ ...doc, arquivo_url: null, status: 'pendente' })
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col gap-3 hover:border-gray-300 transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#1A3C4A]/8 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-[#1A3C4A]" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm leading-tight">{doc.titulo}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{CATEGORIA_LABEL[doc.categoria] || doc.categoria}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${status.color}`}>
                        {status.icon} {status.label}
                    </span>
                    <button
                        onClick={() => onDelete(doc.id)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors rounded"
                        title="Remover documento"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Descrição */}
            {doc.descricao && (
                <p className="text-xs text-gray-500 leading-relaxed">{doc.descricao}</p>
            )}

            {/* Arquivo anexado */}
            {doc.arquivo_url ? (
                <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                    <Paperclip className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                    <a
                        href={doc.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-700 font-medium hover:underline flex-1 truncate"
                    >
                        {doc.arquivo_url.split('/').pop()?.split('?')[0] || 'Ver arquivo'}
                    </a>
                    <button onClick={handleRemoveArquivo} className="text-xs text-gray-400 hover:text-red-500 flex-shrink-0">
                        remover
                    </button>
                </div>
            ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-400 mb-2">Nenhum arquivo anexado</p>
                </div>
            )}

            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

            {/* Ações de upload */}
            <div className="flex gap-2">
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A3C4A] text-white rounded-lg hover:bg-[#2E6B7A] disabled:opacity-50 transition-colors flex-1 justify-center"
                >
                    {uploading ? (
                        <><RefreshCw className="w-3 h-3 animate-spin" /> Enviando...</>
                    ) : (
                        <><Upload className="w-3 h-3" /> {doc.arquivo_url ? 'Substituir' : 'Anexar arquivo'}</>
                    )}
                </button>
                {doc.arquivo_url && (
                    <a
                        href={doc.arquivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <Download className="w-3 h-3" /> Baixar
                    </a>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }}
            />

            {/* Observação */}
            <div>
                <textarea
                    value={observacao}
                    onChange={e => setObservacao(e.target.value)}
                    onBlur={handleSaveObservacao}
                    rows={2}
                    placeholder="Observação (salvo automaticamente)..."
                    className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-[#2D9E6B] text-gray-600 placeholder-gray-300"
                />
                {savingObs && <p className="text-[10px] text-gray-400">Salvando...</p>}
            </div>
        </div>
    )
}

export default function ProjetoDetalhe() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const supabase = createClient()

    const [projeto, setProjeto] = useState<Projeto | null>(null)
    const [documentos, setDocumentos] = useState<Documento[]>([])
    const [loading, setLoading] = useState(true)

    // Novo documento
    const [showNovoDoc, setShowNovoDoc] = useState(false)
    const [novoTitulo, setNovoTitulo] = useState('')
    const [novaCategoria, setNovaCategoria] = useState('outro')
    const [novaDescricao, setNovaDescricao] = useState('')
    const [salvando, setSalvando] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            const tenantId = user?.user_metadata?.tenant_id

            const [{ data: proj }, { data: docs }] = await Promise.all([
                supabase.from('projetos').select('*').eq('id', id).single(),
                supabase.from('projeto_documentos')
                    .select('*')
                    .eq('projeto_id', id)
                    .order('created_at', { ascending: true }),
            ])

            setProjeto(proj)
            setDocumentos(docs || [])
            setLoading(false)
        }
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    const handleUpdate = (updated: Documento) => {
        setDocumentos(prev => prev.map(d => d.id === updated.id ? updated : d))
    }

    const handleDelete = async (docId: string) => {
        await supabase.from('projeto_documentos').delete().eq('id', docId)
        setDocumentos(prev => prev.filter(d => d.id !== docId))
    }

    const handleAddDoc = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!novoTitulo.trim()) return
        setSalvando(true)

        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
            .from('projeto_documentos')
            .insert({
                projeto_id: id,
                tenant_id: user?.user_metadata?.tenant_id,
                titulo: novoTitulo.trim(),
                categoria: novaCategoria,
                descricao: novaDescricao.trim() || null,
            })
            .select('*')
            .single()

        if (!error && data) {
            setDocumentos(prev => [...prev, data])
            setNovoTitulo('')
            setNovaDescricao('')
            setNovaCategoria('outro')
            setShowNovoDoc(false)
        }
        setSalvando(false)
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
                    {/* Resumo de status */}
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
                        onClick={() => setShowNovoDoc(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-[#2D9E6B] text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Adicionar documento
                    </button>
                </div>

                {/* Formulário novo documento */}
                {showNovoDoc && (
                    <form onSubmit={handleAddDoc} className="bg-white border border-[#2D9E6B]/30 rounded-xl p-4 mb-4 shadow-sm space-y-3">
                        <p className="text-sm font-semibold text-gray-700">Novo documento</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-1">
                                <input
                                    required
                                    type="text"
                                    value={novoTitulo}
                                    onChange={e => setNovoTitulo(e.target.value)}
                                    placeholder="Título *"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D9E6B]"
                                />
                            </div>
                            <div>
                                <select
                                    value={novaCategoria}
                                    onChange={e => setNovaCategoria(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-[#2D9E6B]"
                                >
                                    {Object.entries(CATEGORIA_LABEL).map(([v, l]) => (
                                        <option key={v} value={v}>{l}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <input
                                    type="text"
                                    value={novaDescricao}
                                    onChange={e => setNovaDescricao(e.target.value)}
                                    placeholder="Descrição (opcional)"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#2D9E6B]"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowNovoDoc(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700">
                                Cancelar
                            </button>
                            <button type="submit" disabled={salvando} className="px-4 py-1.5 text-sm bg-[#1A3C4A] text-white rounded-lg hover:bg-[#2E6B7A] disabled:opacity-50">
                                {salvando ? 'Salvando...' : 'Adicionar'}
                            </button>
                        </div>
                    </form>
                )}

                {documentos.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum documento cadastrado.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documentos.map(doc => (
                            <DocumentoCard
                                key={doc.id}
                                doc={doc}
                                projetoId={id}
                                onUpdate={handleUpdate}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
