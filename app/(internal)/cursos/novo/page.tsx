'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Sparkles, RefreshCw, ImageIcon, Upload } from 'lucide-react'

export default function NovoCursoPage() {
    const router = useRouter()
    const supabase = createClient()
    const [titulo, setTitulo] = useState('')
    const [categoria, setCategoria] = useState('profissionalizante')
    const [descricao, setDescricao] = useState('')
    const [cargaHoraria, setCargaHoraria] = useState<number | ''>('')
    const [instrutor, setInstrutor] = useState('')
    const [modalidade, setModalidade] = useState('presencial')
    const [visibilidade, setVisibilidade] = useState('publico')
    const [presencaMinima, setPresencaMinima] = useState(75)
    const [conteudoProgramatico, setConteudoProgramatico] = useState<{ modulo: string, topicos: string }[]>([
        { modulo: '', topicos: '' }
    ])

    const [thumbnailUrl, setThumbnailUrl] = useState('')
    const [thumbLoading, setThumbLoading] = useState(false)
    const [thumbError, setThumbError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const gerarThumbnail = async (tituloParam?: string) => {
        const t = (tituloParam ?? titulo).trim()
        if (!t) return
        setThumbLoading(true)
        setThumbError(null)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            const res = await fetch('/api/cursos/gerar-thumb', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ titulo: t, tenantId: user?.user_metadata?.tenant_id }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setThumbnailUrl(data.url)
        } catch (e: any) {
            setThumbError(e.message || 'Erro ao gerar imagem')
        } finally {
            setThumbLoading(false)
        }
    }

    const handleUploadImagem = async (file: File) => {
        setThumbLoading(true)
        setThumbError(null)
        try {
            const form = new FormData()
            form.append('file', file)
            const res = await fetch('/api/cursos/upload-thumb', { method: 'POST', body: form })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setThumbnailUrl(data.url)
        } catch (e: any) {
            setThumbError(e.message || 'Erro ao fazer upload')
        } finally {
            setThumbLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent, statusOverride?: string) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()

        const { error: insertError } = await supabase.from('cursos').insert({
            tenant_id: user?.user_metadata?.tenant_id,
            titulo,
            descricao,
            categoria,
            carga_horaria: cargaHoraria || 0,
            instrutor,
            modalidade,
            visibilidade,
            presenca_minima: presencaMinima,
            conteudo_programatico: conteudoProgramatico,
            thumbnail_url: thumbnailUrl || null,
            status: statusOverride || 'rascunho',
        })

        if (insertError) {
            setError(insertError.message)
            setLoading(false)
            return
        }

        router.push('/cursos')
        router.refresh()
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-[#1A3C4A]">Novo Curso</h1>
                <p className="text-gray-500 mt-1">Estruture um novo curso de capacitação para criar turmas posteriormente.</p>
            </div>

            <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
                {error && <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">{error}</div>}

                {/* Informações Básicas */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Informações Básicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título do Curso *</label>
                            <input
                                type="text"
                                value={titulo}
                                onChange={e => setTitulo(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]"
                                placeholder="Ex: Informática Básica, Corte e Costura..."
                            />
                        </div>

                        {/* Thumbnail Preview */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail do Curso</label>
                            <div className="flex gap-4 items-start">
                                <div className="w-64 h-36 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0 relative">
                                    {thumbLoading ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-50">
                                            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin mb-2" />
                                            <p className="text-xs text-purple-500 font-medium">Gerando com IA...</p>
                                        </div>
                                    ) : thumbnailUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-gray-300">
                                            <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                                            <p className="text-xs">Aguardando título</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => gerarThumbnail()}
                                        disabled={!titulo.trim() || thumbLoading}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 border border-purple-200 rounded-md hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        {thumbLoading ? 'Gerando...' : 'Gerar com IA'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={thumbLoading}
                                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Upload className="w-3 h-3" />
                                        Fazer upload
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadImagem(f) }}
                                    />
                                    {thumbError && <p className="text-xs text-red-500">{thumbError}</p>}
                                    <div className="mt-1">
                                        <p className="text-xs text-gray-400 mb-1">Ou cole uma URL:</p>
                                        <input
                                            type="url"
                                            value={thumbnailUrl}
                                            onChange={e => setThumbnailUrl(e.target.value)}
                                            className="w-48 px-2 py-1 text-xs border border-gray-300 rounded-md focus:outline-none"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                            <input type="text" value={categoria} onChange={e => setCategoria(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" placeholder="Ex: Profissionalizante" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instrutor / Facilitador</label>
                            <input type="text" value={instrutor} onChange={e => setInstrutor(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" placeholder="Nome do responsável pelas aulas" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Carga Horária (Total em Horas) *</label>
                            <input type="number" min="1" value={cargaHoraria} onChange={e => setCargaHoraria(Number(e.target.value))} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade *</label>
                            <select value={modalidade} onChange={e => setModalidade(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]">
                                <option value="presencial">Presencial</option>
                                <option value="online">Online (EAD)</option>
                                <option value="hibrido">Híbrido</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ementa / Descrição Geral</label>
                            <textarea rows={4} value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" placeholder="Descreva o que os alunos aprenderão neste curso..."></textarea>
                        </div>
                    </div>
                </div>

                {/* Conteúdo Programático */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Conteúdo Programático</h3>
                    <div className="space-y-4">
                        {conteudoProgramatico.map((m, i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-3 items-start bg-gray-50 p-4 rounded-md border border-gray-200">
                                <div className="flex-1 w-full space-y-3">
                                    <input type="text" placeholder={`Módulo ${i + 1} (Ex: Introdução ao Tema)`} value={m.modulo} onChange={e => { const nc = [...conteudoProgramatico]; nc[i].modulo = e.target.value; setConteudoProgramatico(nc) }} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                    <textarea rows={2} placeholder="Tópicos abordados (separados por vírgula)" value={m.topicos} onChange={e => { const nc = [...conteudoProgramatico]; nc[i].topicos = e.target.value; setConteudoProgramatico(nc) }} className="w-full text-sm px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                </div>
                                <button type="button" onClick={() => setConteudoProgramatico(conteudoProgramatico.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setConteudoProgramatico([...conteudoProgramatico, { modulo: '', topicos: '' }])} className="text-sm font-medium text-[#2E6B7A] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar Módulo</button>
                    </div>
                </div>

                {/* Inscrição e Certificação */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Inscrição e Certificação</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidade no Portal</label>
                            <select value={visibilidade} onChange={e => setVisibilidade(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]">
                                <option value="publico">Público (Aberto para inscrições no portal)</option>
                                <option value="interno">Interno (Apenas gestores matriculam alunos)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Presença Mínima para Certificado (%)</label>
                            <input type="number" min="0" max="100" value={presencaMinima} onChange={e => setPresencaMinima(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                    <button type="button" onClick={e => handleCreate(e, 'rascunho')} disabled={loading} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50">
                        {loading ? 'Salvando...' : 'Salvar Rascunho'}
                    </button>
                    <button type="button" onClick={e => handleCreate(e, 'ativo')} disabled={loading} className="px-4 py-2 text-sm bg-[#2D9E6B] text-white rounded-md hover:bg-green-600 disabled:opacity-50">
                        {loading ? 'Publicando...' : 'Publicar Curso'}
                    </button>
                </div>
            </form>
        </div>
    )
}
