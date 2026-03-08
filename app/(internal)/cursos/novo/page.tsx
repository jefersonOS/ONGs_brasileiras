'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2 } from 'lucide-react'

export default function NovoCursoPage() {
    const router = useRouter()
    const supabase = createClient()

    // Form States
    const [titulo, setTitulo] = useState('')
    const [categoria, setCategoria] = useState('profissionalizante')
    const [descricao, setDescricao] = useState('')
    const [cargaHoraria, setCargaHoraria] = useState<number | ''>('')
    const [instrutor, setInstrutor] = useState('')
    const [modalidade, setModalidade] = useState('presencial')

    // Settings
    const [visibilidade, setVisibilidade] = useState('publico')
    const [presencaMinima, setPresencaMinima] = useState(75)

    // Dynamic Arrays
    const [conteudoProgramatico, setConteudoProgramatico] = useState<{ modulo: string, topicos: string }[]>([
        { modulo: '', topicos: '' }
    ])

    const [status, setStatus] = useState('rascunho')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
            status: statusOverride || status
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

                {/* Detalhes Principais */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Informações Básicas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título do Curso *</label>
                            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" placeholder="Ex: Informática Básica, Corte e Costura..." />
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
                                    <input
                                        type="text"
                                        placeholder={`Módulo ${i + 1} (Ex: Introdução ao Tema)`}
                                        value={m.modulo}
                                        onChange={e => { const nc = [...conteudoProgramatico]; nc[i].modulo = e.target.value; setConteudoProgramatico(nc) }}
                                        className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]"
                                    />
                                    <textarea
                                        rows={2}
                                        placeholder="Tópicos abordados (separados por vírgula)"
                                        value={m.topicos}
                                        onChange={e => { const nc = [...conteudoProgramatico]; nc[i].topicos = e.target.value; setConteudoProgramatico(nc) }}
                                        className="w-full text-sm px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]"
                                    />
                                </div>
                                <button type="button" onClick={() => setConteudoProgramatico(conteudoProgramatico.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setConteudoProgramatico([...conteudoProgramatico, { modulo: '', topicos: '' }])} className="text-sm font-medium text-[#2E6B7A] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar Módulo</button>
                    </div>
                </div>

                {/* Regras e Visibilidade */}
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
