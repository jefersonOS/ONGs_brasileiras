'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, Trash2, Sparkles, ArrowLeft } from 'lucide-react'

export default function EditarAtividadePage() {
    const router = useRouter()
    const { id } = useParams<{ id: string }>()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form States
    const [titulo, setTitulo] = useState('')
    const [tipo, setTipo] = useState('educacional')
    const [descricao, setDescricao] = useState('')
    const [projetoId, setProjetoId] = useState('')
    const [projetos, setProjetos] = useState<{ id: string, nome: string }[]>([])
    const [visibilidade, setVisibilidade] = useState('publico')
    const [vagasLimitadas, setVagasLimitadas] = useState(false)
    const [vagas, setVagas] = useState<number | ''>('')
    const [exigeInscricao, setExigeInscricao] = useState(true)
    const [emiteComprovante, setEmiteComprovante] = useState(false)
    const [presencaMinima, setPresencaMinima] = useState(75)
    const [isItinerante, setIsItinerante] = useState(false)
    const [datas, setDatas] = useState<{ data: string, hora_inicio: string, hora_fim: string }[]>([
        { data: '', hora_inicio: '', hora_fim: '' }
    ])
    const [locais, setLocais] = useState<{ nome: string, endereco: string }[]>([
        { nome: '', endereco: '' }
    ])
    const [publicoAlvo, setPublicoAlvo] = useState('')
    const [faixaEtaria, setFaixaEtaria] = useState('livre')
    const [status, setStatus] = useState('rascunho')

    useEffect(() => {
        const init = async () => {
            const [{ data: atividade }, { data: projetosData }] = await Promise.all([
                supabase.from('atividades').select('*').eq('id', id).single(),
                supabase.from('projetos').select('id, nome').eq('status', 'ativo'),
            ])

            if (!atividade) {
                setError('Atividade não encontrada.')
                setLoading(false)
                return
            }

            setProjetos(projetosData || [])
            setTitulo(atividade.titulo || '')
            setTipo(atividade.tipo || 'educacional')
            setDescricao(atividade.descricao || '')
            setProjetoId(atividade.projeto_id || '')
            setVisibilidade(atividade.visibilidade || 'publico')
            setVagas(atividade.vagas ?? '')
            setVagasLimitadas(!!atividade.vagas)
            setExigeInscricao(atividade.exige_inscricao ?? true)
            setEmiteComprovante(atividade.emite_comprovante ?? false)
            setPresencaMinima(atividade.presenca_minima ?? 75)
            setIsItinerante(atividade.is_itinerante ?? false)
            setDatas(Array.isArray(atividade.datas) && atividade.datas.length > 0
                ? atividade.datas
                : [{ data: '', hora_inicio: '', hora_fim: '' }])
            setLocais(Array.isArray(atividade.locais) && atividade.locais.length > 0
                ? atividade.locais
                : [{ nome: '', endereco: '' }])
            setPublicoAlvo(atividade.publico_alvo || '')
            setFaixaEtaria(atividade.faixa_etaria || 'livre')
            setStatus(atividade.status || 'rascunho')
            setLoading(false)
        }
        init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])

    const handleGenerateDescricao = async () => {
        if (!titulo) { setError('Preencha o título antes de gerar a descrição.'); return }
        setIsGenerating(true)
        setError(null)
        try {
            setDescricao(`[Gerado por IA] A atividade "${titulo}" é uma excelente oportunidade para o desenvolvimento focado em ${tipo}. Com abordagens práticas e teóricas, nosso objetivo é oferecer um ambiente integrador que proporcione conhecimentos aplicáveis ao dia a dia. Inscreva-se e garanta sua vaga para fortalecer nossa comunidade!`)
        } catch { setError('Falha ao contatar a IA') }
        finally { setIsGenerating(false) }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError(null)

        const { error: updateError } = await supabase.from('atividades').update({
            titulo,
            descricao,
            tipo,
            projeto_id: projetoId || null,
            visibilidade,
            vagas: vagasLimitadas && vagas !== '' ? vagas : null,
            locais,
            datas,
            exige_inscricao: exigeInscricao,
            emite_comprovante: emiteComprovante,
            presenca_minima: presencaMinima,
            is_itinerante: isItinerante,
            publico_alvo: publicoAlvo,
            faixa_etaria: faixaEtaria,
            status,
        }).eq('id', id)

        if (updateError) {
            setError(updateError.message)
            setSaving(false)
            return
        }

        router.push('/atividades')
        router.refresh()
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-[#2D9E6B] border-t-transparent rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <Link href="/atividades" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1A3C4A] transition-colors mb-3">
                    <ArrowLeft className="w-4 h-4" /> Voltar para Atividades
                </Link>
                <h1 className="text-2xl font-bold text-[#1A3C4A]">Editar Atividade</h1>
                <p className="text-gray-500 mt-1">Atualize as informações da atividade.</p>
            </div>

            <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
                {error && <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">{error}</div>}

                {/* Detalhes Principais */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Detalhes Principais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Título da Atividade *</label>
                            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" placeholder="Ex: Feirão de Empregos, Oficina de Pintura..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                            <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]">
                                <option value="educacional">Educacional / Cursos Livres</option>
                                <option value="esportiva">Esportiva</option>
                                <option value="cultural">Cultural</option>
                                <option value="saude">Saúde / Bem-estar</option>
                                <option value="assistencia">Assistência Social</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a um Projeto</label>
                            <select value={projetoId} onChange={e => setProjetoId(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]">
                                <option value="">Sem vínculo</option>
                                {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                                <button type="button" onClick={handleGenerateDescricao} disabled={isGenerating} className="text-xs flex items-center gap-1 text-[#2E6B7A] hover:text-[#2D9E6B] px-2 py-1 bg-teal-50 rounded border border-teal-100 transition-colors">
                                    <Sparkles className="w-3 h-3" />
                                    {isGenerating ? 'Gerando...' : 'Gerar descrição com IA'}
                                </button>
                            </div>
                            <textarea rows={4} value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" placeholder="Descreva os objetivos, o que será abordado, qual o formato da atividade..."></textarea>
                        </div>
                    </div>
                </div>

                {/* Datas e Locais */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Datas e Locais</h3>

                    <div className="space-y-4 shadow-sm p-4 bg-teal-50/30 rounded-lg border border-teal-100/50 mb-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className={`w-10 h-5 rounded-full transition-colors relative ${isItinerante ? 'bg-[#2D9E6B]' : 'bg-gray-300'}`}>
                                <input type="checkbox" checked={isItinerante} onChange={e => setIsItinerante(e.target.checked)} className="sr-only" />
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isItinerante ? 'left-6' : 'left-1'}`}></div>
                            </div>
                            <div>
                                <span className="text-sm font-bold text-[#1A3C4A]">Atividade Itinerante</span>
                                <p className="text-[10px] text-gray-500">Esta atividade ocorre em diferentes locais e datas.</p>
                            </div>
                        </label>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Encontros Planejados</label>
                        {datas.map((d, i) => (
                            <div key={i} className="flex gap-3 items-center">
                                <input type="date" value={d.data} onChange={e => { const nd = [...datas]; nd[i].data = e.target.value; setDatas(nd) }} className="flex-1 px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                <span>das</span>
                                <input type="time" value={d.hora_inicio} onChange={e => { const nd = [...datas]; nd[i].hora_inicio = e.target.value; setDatas(nd) }} className="w-32 px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                <span>às</span>
                                <input type="time" value={d.hora_fim} onChange={e => { const nd = [...datas]; nd[i].hora_fim = e.target.value; setDatas(nd) }} className="w-32 px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                <button type="button" onClick={() => setDatas(datas.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setDatas([...datas, { data: '', hora_inicio: '', hora_fim: '' }])} className="text-sm font-medium text-[#2E6B7A] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar Data</button>
                    </div>

                    <div className="space-y-4 mt-6">
                        <label className="block text-sm font-medium text-gray-700">Locais de Realização</label>
                        {locais.map((l, i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-3 items-center">
                                <input type="text" placeholder="Nome do local" value={l.nome} onChange={e => { const nl = [...locais]; nl[i].nome = e.target.value; setLocais(nl) }} className="flex-1 w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                <input type="text" placeholder="Endereço (opcional)" value={l.endereco} onChange={e => { const nl = [...locais]; nl[i].endereco = e.target.value; setLocais(nl) }} className="flex-1 w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                <button type="button" onClick={() => setLocais(locais.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setLocais([...locais, { nome: '', endereco: '' }])} className="text-sm font-medium text-[#2E6B7A] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar Local</button>
                    </div>
                </div>

                {/* Inscrição e Regras */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Inscrição e Regras</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Visibilidade no Portal</label>
                            <select value={visibilidade} onChange={e => setVisibilidade(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]">
                                <option value="publico">Público (Aparece no portal)</option>
                                <option value="interno">Interno (Somente para equipe)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Público-Alvo Específico</label>
                            <input type="text" value={publicoAlvo} onChange={e => setPublicoAlvo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" placeholder="Ex: Mulheres da região oeste" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Faixa Etária</label>
                            <select value={faixaEtaria} onChange={e => setFaixaEtaria(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]">
                                <option value="livre">Classificação Livre</option>
                                <option value="criancas">Crianças (até 12 anos)</option>
                                <option value="adolescentes">Adolescentes (13 a 17 anos)</option>
                                <option value="adultos">Adultos (+18 anos)</option>
                                <option value="idosos">Idosos (+60 anos)</option>
                            </select>
                        </div>
                        <div className="flex gap-4 items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={vagasLimitadas} onChange={e => setVagasLimitadas(e.target.checked)} className="w-4 h-4 text-[#2D9E6B] rounded border-gray-300 focus:ring-[#2D9E6B]" />
                                <span className="text-sm font-medium text-gray-700">Limitar vagas?</span>
                            </label>
                            {vagasLimitadas && (
                                <input type="number" min="1" placeholder="Nº vagas" value={vagas} onChange={e => setVagas(Number(e.target.value))} className="w-24 px-3 py-2 border bg-white border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#2D9E6B]" />
                            )}
                        </div>
                        <div className="flex gap-4 items-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={exigeInscricao} onChange={e => setExigeInscricao(e.target.checked)} className="w-4 h-4 text-[#2D9E6B] rounded border-gray-300 focus:ring-[#2D9E6B]" />
                                <span className="text-sm font-medium text-gray-700">Exige Inscrição Prévia</span>
                            </label>
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={emiteComprovante} onChange={e => setEmiteComprovante(e.target.checked)} className="w-4 h-4 text-[#2D9E6B] rounded border-gray-300 focus:ring-[#2D9E6B]" />
                                <span className="text-sm font-medium text-gray-700">Emitir Comprovante Automático de Presença</span>
                            </label>
                            {emiteComprovante && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">% de Presença Mínima</label>
                                    <input type="number" min="0" max="100" value={presencaMinima} onChange={e => setPresencaMinima(Number(e.target.value))} className="w-24 px-3 py-1.5 border bg-white border-gray-300 rounded-md text-sm focus:outline-none focus:ring-[#2D9E6B]" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                    <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]">
                        <option value="rascunho">Salvar como Rascunho</option>
                        <option value="publicada">Salvar e Publicar</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="encerrada">Encerrada</option>
                        <option value="cancelada">Cancelada</option>
                    </select>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-[#1A3C4A] text-white rounded-md hover:bg-[#2E6B7A] transition-colors disabled:opacity-50">
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
