'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Sparkles, GripVertical, ChevronDown, ChevronUp, Phone, ToggleLeft, ToggleRight } from 'lucide-react'

// ─── Form Builder ────────────────────────────────────────────────────────────

type TipoCampo = 'texto' | 'email' | 'telefone' | 'numero' | 'selecao' | 'textarea'

interface CampoFormulario {
    id: string
    tipo: TipoCampo
    label: string
    placeholder: string
    obrigatorio: boolean
    opcoes: string[]
    is_whatsapp: boolean
}

const TIPOS_CAMPO: { value: TipoCampo, label: string }[] = [
    { value: 'texto', label: 'Texto curto' },
    { value: 'email', label: 'E-mail' },
    { value: 'telefone', label: 'Telefone / WhatsApp' },
    { value: 'numero', label: 'Número' },
    { value: 'selecao', label: 'Seleção (dropdown)' },
    { value: 'textarea', label: 'Texto longo' },
]

const CAMPOS_DEFAULT: CampoFormulario[] = [
    { id: '1', tipo: 'texto', label: 'Nome Completo', placeholder: 'Seu nome completo', obrigatorio: true, opcoes: [], is_whatsapp: false },
    { id: '2', tipo: 'email', label: 'E-mail', placeholder: 'seu@email.com', obrigatorio: true, opcoes: [], is_whatsapp: false },
    { id: '3', tipo: 'telefone', label: 'WhatsApp', placeholder: '(00) 00000-0000', obrigatorio: true, opcoes: [], is_whatsapp: true },
    { id: '4', tipo: 'texto', label: 'CPF', placeholder: '000.000.000-00', obrigatorio: false, opcoes: [], is_whatsapp: false },
]

function FormBuilder({ campos, setCampos }: { campos: CampoFormulario[], setCampos: (c: CampoFormulario[]) => void }) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const addCampo = () => {
        const newCampo: CampoFormulario = {
            id: Date.now().toString(),
            tipo: 'texto',
            label: 'Novo Campo',
            placeholder: '',
            obrigatorio: false,
            opcoes: [],
            is_whatsapp: false,
        }
        setCampos([...campos, newCampo])
        setExpandedId(newCampo.id)
    }

    const updateCampo = (id: string, patch: Partial<CampoFormulario>) => {
        setCampos(campos.map(c => c.id === id ? { ...c, ...patch } : c))
    }

    const removeCampo = (id: string) => {
        setCampos(campos.filter(c => c.id !== id))
    }

    const moveUp = (i: number) => {
        if (i === 0) return
        const next = [...campos];
        [next[i - 1], next[i]] = [next[i], next[i - 1]]
        setCampos(next)
    }

    const moveDown = (i: number) => {
        if (i === campos.length - 1) return
        const next = [...campos];
        [next[i], next[i + 1]] = [next[i + 1], next[i]]
        setCampos(next)
    }

    return (
        <div className="space-y-3">
            {campos.map((campo, i) => (
                <div key={campo.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                    <div className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === campo.id ? null : campo.id)}>
                        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm text-gray-800">{campo.label || 'Sem título'}</span>
                            <span className="ml-2 text-[10px] text-gray-400 uppercase">{TIPOS_CAMPO.find(t => t.value === campo.tipo)?.label}</span>
                            {campo.is_whatsapp && <span className="ml-2 text-[10px] text-green-600 font-bold uppercase">WhatsApp</span>}
                            {campo.obrigatorio && <span className="ml-2 text-[10px] text-red-500 uppercase">*obrigatório</span>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button type="button" onClick={e => { e.stopPropagation(); moveUp(i) }} className="p-1 text-gray-400 hover:text-gray-600"><ChevronUp className="w-3 h-3" /></button>
                            <button type="button" onClick={e => { e.stopPropagation(); moveDown(i) }} className="p-1 text-gray-400 hover:text-gray-600"><ChevronDown className="w-3 h-3" /></button>
                            <button type="button" onClick={e => { e.stopPropagation(); removeCampo(campo.id) }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>

                    {expandedId === campo.id && (
                        <div className="p-4 space-y-3 border-t border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Campo</label>
                                    <select
                                        value={campo.tipo}
                                        onChange={e => updateCampo(campo.id, { tipo: e.target.value as TipoCampo, is_whatsapp: e.target.value === 'telefone' ? campo.is_whatsapp : false })}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none"
                                    >
                                        {TIPOS_CAMPO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Rótulo (label)</label>
                                    <input
                                        type="text"
                                        value={campo.label}
                                        onChange={e => updateCampo(campo.id, { label: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none"
                                        placeholder="Ex: Nome Completo"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder (dica)</label>
                                    <input
                                        type="text"
                                        value={campo.placeholder}
                                        onChange={e => updateCampo(campo.id, { placeholder: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none"
                                        placeholder="Ex: Digite seu nome..."
                                    />
                                </div>
                                <div className="flex items-center gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => updateCampo(campo.id, { obrigatorio: !campo.obrigatorio })}
                                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${campo.obrigatorio ? 'text-red-600' : 'text-gray-400'}`}
                                    >
                                        {campo.obrigatorio ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                        Obrigatório
                                    </button>
                                    {campo.tipo === 'telefone' && (
                                        <button
                                            type="button"
                                            onClick={() => updateCampo(campo.id, { is_whatsapp: !campo.is_whatsapp })}
                                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${campo.is_whatsapp ? 'text-green-600' : 'text-gray-400'}`}
                                        >
                                            {campo.is_whatsapp ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                            <Phone className="w-4 h-4" /> Usar para WhatsApp
                                        </button>
                                    )}
                                </div>
                            </div>

                            {campo.tipo === 'selecao' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Opções (uma por linha)</label>
                                    <textarea
                                        rows={4}
                                        value={campo.opcoes.join('\n')}
                                        onChange={e => updateCampo(campo.id, { opcoes: e.target.value.split('\n') })}
                                        onKeyDown={e => e.stopPropagation()}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none"
                                        placeholder={"Opção 1\nOpção 2\nOpção 3"}
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">Pressione Enter para adicionar uma nova opção</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            <button
                type="button"
                onClick={addCampo}
                className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm font-medium text-gray-400 hover:border-[#2D9E6B] hover:text-[#2D9E6B] transition-colors flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> Adicionar Campo
            </button>
        </div>
    )
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function NovaAtividadePage() {
    const router = useRouter()
    const supabase = createClient()

    // Form States
    const [titulo, setTitulo] = useState('')
    const [tipo, setTipo] = useState('educacional')
    const [descricao, setDescricao] = useState('')

    // Project Linking
    const [projetoId, setProjetoId] = useState('')
    const [projetos, setProjetos] = useState<{ id: string, nome: string }[]>([])

    // Settings
    const [visibilidade, setVisibilidade] = useState('publico')
    const [vagasLimitadas, setVagasLimitadas] = useState(false)
    const [vagas, setVagas] = useState<number | ''>('')
    const [exigeInscricao, setExigeInscricao] = useState(true)
    const [emiteComprovante, setEmiteComprovante] = useState(false)
    const [presencaMinima, setPresencaMinima] = useState(75)
    const [isItinerante, setIsItinerante] = useState(false)

    // Dynamic arrays
    const [datas, setDatas] = useState<{ data: string, hora_inicio: string, hora_fim: string }[]>([
        { data: '', hora_inicio: '', hora_fim: '' }
    ])
    const [locais, setLocais] = useState<{ nome: string, endereco: string }[]>([
        { nome: '', endereco: '' }
    ])

    // Audience
    const [publicoAlvo, setPublicoAlvo] = useState('')
    const [faixaEtaria, setFaixaEtaria] = useState('livre')

    const [status, setStatus] = useState('rascunho')

    const [formularioInscricao, setFormularioInscricao] = useState<CampoFormulario[]>(CAMPOS_DEFAULT)

    const [loading, setLoading] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        supabase.from('projetos').select('id, nome').eq('status', 'ativo').then(({ data }) => {
            if (data) setProjetos(data)
        })
    }, [supabase])

    const handleGenerateDescricao = async () => {
        if (!titulo) {
            setError("Por favor, preencha o título antes de pedir para a IA gerar a descrição.")
            return
        }
        setIsGenerating(true)
        setError(null)
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const _prompt = `Crie uma descrição atraente para uma atividade chamada "${titulo}" do tipo "${tipo}". 
            Público-alvo: ${publicoAlvo || 'Público em geral'}. A descrição deve ter cerca de 2 parágrafos, ser convidativa e usar tom profissional mas acolhedor.`

            // Reusing existing abstract ai generation endpoint (since it takes ideiaCentral and returns a JSON for Planos, we can adapt it or just do a generic text call. 
            // For MVP let's assume throwing it to standard AI or mocking a generic description generation if we haven't built a generic endpoint yet)

            // To stick to existing structure, we inject a placeholder message waiting for the dedicated /api/ia/chat route
            setDescricao(`[Gerado por IA] A atividade "${titulo}" é uma excelente oportunidade para o desenvolvimento focado em ${tipo}. Com abordagens práticas e teóricas, nosso objetivo é oferecer um ambiente integrador que proporcione conhecimentos aplicáveis ao dia a dia. Inscreva-se e garanta sua vaga para fortalecer nossa comunidade!`)
        } catch (err) {
            console.error(err)
            setError("Falha ao contatar a IA")
        } finally {
            setIsGenerating(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()

        const { error: insertError } = await supabase.from('atividades').insert({
            tenant_id: user?.user_metadata?.tenant_id,
            projeto_id: projetoId || null,
            responsavel_id: user?.id,
            titulo,
            descricao,
            tipo,
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
            formulario_inscricao: exigeInscricao ? formularioInscricao : null
        })

        if (insertError) {
            setError(insertError.message)
            setLoading(false)
            return
        }

        router.push('/atividades')
        router.refresh()
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-[#1A3C4A]">Nova Atividade</h1>
                <p className="text-gray-500 mt-1">Crie ações, eventos, campanhas, modalidades esportivas e afins.</p>
            </div>

            <form onSubmit={handleCreate} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-8">
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

                {/* Dinâmica de Aulas e Locais */}
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
                                <input type="text" placeholder="Nome do local (ex: Quadra Principal)" value={l.nome} onChange={e => { const nl = [...locais]; nl[i].nome = e.target.value; setLocais(nl) }} className="flex-1 w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                <input type="text" placeholder="Endereço (opcional)" value={l.endereco} onChange={e => { const nl = [...locais]; nl[i].endereco = e.target.value; setLocais(nl) }} className="flex-1 w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                <button type="button" onClick={() => setLocais(locais.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setLocais([...locais, { nome: '', endereco: '' }])} className="text-sm font-medium text-[#2E6B7A] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar Local</button>
                    </div>
                </div>

                {/* Configurações da Inscrição */}
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

                {/* Formulário de Inscrição */}
                {exigeInscricao && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1 pb-2 border-b border-gray-100">Formulário de Inscrição</h3>
                        <p className="text-xs text-gray-400 mb-4">Monte o formulário que os interessados preencherão ao se inscrever. O campo marcado como <span className="text-green-600 font-medium">WhatsApp</span> será usado para envio da confirmação.</p>
                        <FormBuilder campos={formularioInscricao} setCampos={setFormularioInscricao} />
                    </div>
                )}

                <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
                    <select value={status} onChange={e => setStatus(e.target.value)} className="px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]">
                        <option value="rascunho">Salvar como Rascunho</option>
                        <option value="publicada">Salvar e Publicar Atividade</option>
                    </select>

                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-[#1A3C4A] text-white rounded-md hover:bg-[#2E6B7A] transition-colors disabled:opacity-50">
                            {loading ? 'Salvando...' : 'Confirmar Atividade'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
