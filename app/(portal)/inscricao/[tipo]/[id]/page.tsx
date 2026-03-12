'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertTriangle, ArrowLeft, CalendarDays, MapPin, Users, Tag } from 'lucide-react'

interface CampoFormulario {
    id: string
    tipo: 'texto' | 'email' | 'telefone' | 'numero' | 'selecao' | 'textarea'
    label: string
    placeholder: string
    obrigatorio: boolean
    opcoes: string[]
    is_whatsapp: boolean
}

function CampoInput({ campo, value, onChange }: { campo: CampoFormulario, value: string, onChange: (v: string) => void }) {
    const base = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all bg-white text-gray-800"

    if (campo.tipo === 'selecao') {
        return (
            <select value={value} onChange={e => onChange(e.target.value)} required={campo.obrigatorio} className={base + " bg-white"}>
                <option value="">Selecione uma opção...</option>
                {campo.opcoes.filter(Boolean).map(op => <option key={op} value={op}>{op}</option>)}
            </select>
        )
    }

    if (campo.tipo === 'textarea') {
        return (
            <textarea
                rows={3}
                value={value}
                onChange={e => onChange(e.target.value)}
                required={campo.obrigatorio}
                placeholder={campo.placeholder}
                className={base + " resize-none"}
            />
        )
    }

    const inputType = campo.tipo === 'email' ? 'email' : campo.tipo === 'numero' ? 'number' : campo.tipo === 'telefone' ? 'tel' : 'text'

    return (
        <input
            type={inputType}
            value={value}
            onChange={e => onChange(e.target.value)}
            required={campo.obrigatorio}
            placeholder={campo.placeholder}
            className={base}
        />
    )
}

function InscricaoForm({ params }: { params: { tipo: string, id: string } }) {
    const { tipo, id } = params
    const searchParams = useSearchParams()
    const turmaId = searchParams.get('turma')

    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [entidade, setEntidade] = useState<any>(null)
    const [turma, setTurma] = useState<any>(null)
    const [formulario, setFormulario] = useState<CampoFormulario[]>([])
    const [respostas, setRespostas] = useState<Record<string, string>>({})

    const [email, setEmail] = useState('')
    const [whatsapp, setWhatsapp] = useState('')

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [statusInscricao, setStatusInscricao] = useState<'idle' | 'sucesso' | 'erro' | 'ja_inscrito'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        const fetchContext = async () => {
            setLoading(true)
            const { data: { user: currentUser } } = await supabase.auth.getUser()

            if (!currentUser) {
                let tenantId: string | null = null
                if (tipo === 'curso') {
                    const { data: c } = await supabase.from('cursos').select('tenant_id').eq('id', id).single()
                    tenantId = c?.tenant_id || null
                } else {
                    const { data: a } = await supabase.from('atividades').select('tenant_id').eq('id', id).single()
                    tenantId = a?.tenant_id || null
                }
                const redirectUrl = `/inscricao/${tipo}/${id}${turmaId ? `?turma=${turmaId}` : ''}`
                const registerParams = new URLSearchParams({ perfil: 'cidadao', redirect: redirectUrl })
                if (tenantId) registerParams.set('tenantId', tenantId)
                router.replace(`/register?${registerParams.toString()}`)
                return
            }

            setUser(currentUser)

            // Checar se já está inscrito
            let query = supabase.from('inscricoes').select('id').eq('cidadao_id', currentUser.id).eq('entidade_id', id)
            if (turmaId) query = query.eq('turma_id', turmaId)
            const { data: inscricaoExistente } = await query.single()
            if (inscricaoExistente) {
                setStatusInscricao('ja_inscrito')
                setLoading(false)
                return
            }

            // Buscar email e whatsapp do perfil para pré-preencher
            const { data: perfilData } = await supabase
                .from('users')
                .select('email, whatsapp')
                .eq('id', currentUser.id)
                .single()

            if (perfilData?.email) setEmail(perfilData.email)
            if (perfilData?.whatsapp) setWhatsapp(perfilData.whatsapp)

            // Buscar curso/turma
            if (tipo === 'curso') {
                const { data: c } = await supabase.from('cursos').select('titulo, modalidade').eq('id', id).single()
                setEntidade(c)
                if (turmaId) {
                    const { data: t } = await supabase.from('turmas').select('vagas, data_inicio, data_fim, data_limite_inscricao, formulario_inscricao').eq('id', turmaId).single()
                    setTurma(t)
                    if (t?.formulario_inscricao?.length) {
                        setFormulario(t.formulario_inscricao)
                        const initialRespostas: Record<string, string> = {}
                        t.formulario_inscricao.forEach((campo: CampoFormulario) => {
                            initialRespostas[campo.id] = ''
                        })
                        setRespostas(initialRespostas)
                    }
                }
            } else if (tipo === 'atividade') {
                const { data: a } = await supabase.from('atividades').select('titulo, tipo, exige_inscricao, vagas, datas, locais, publico_alvo, descricao').eq('id', id).single()
                setEntidade(a)
            }

            setLoading(false)
        }

        fetchContext()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tipo, id, turmaId])

    const handleInscricao = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        // Atualizar email e whatsapp no perfil caso tenham sido preenchidos agora
        await supabase.from('users').update({ email: email || null, whatsapp: whatsapp || null }).eq('id', user.id)

        const campoWhatsApp = formulario.find(c => c.is_whatsapp)
        const telefoneWhatsApp = campoWhatsApp ? (respostas[campoWhatsApp.id] || whatsapp || null) : whatsapp || null

        const { data: { user: currentUser } } = await supabase.auth.getUser()

        const res = await fetch('/api/inscricao/confirmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo,
                id,
                turmaId: turmaId || null,
                cidadaoId: user.id,
                tenantId: currentUser?.user_metadata?.tenant_id,
                dadosFormulario: respostas,
                telefoneWhatsApp,
            })
        })

        const result = await res.json()

        if (!result.success) {
            setErrorMessage(result.error)
            setStatusInscricao('erro')
        } else {
            setStatusInscricao('sucesso')
        }

        setSubmitting(false)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F7F8] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-[#2D9E6B] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[#1A3C4A] font-medium">Carregando formulário...</p>
                </div>
            </div>
        )
    }

    if (statusInscricao === 'sucesso') {
        return (
            <div className="min-h-screen bg-[#F5F7F8] flex items-center justify-center p-6">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Inscrição Confirmada!</h1>
                    <p className="text-gray-600 mb-8">
                        Sua vaga em <strong>{entidade?.titulo}</strong> foi reservada. Você receberá uma confirmação pelo WhatsApp em breve.
                    </p>
                    <Link href="/minha-area" className="block w-full py-3 bg-[#1A3C4A] text-white rounded-md font-bold hover:bg-[#2E6B7A] transition-colors">
                        Acessar Minha Área
                    </Link>
                </div>
            </div>
        )
    }

    if (statusInscricao === 'ja_inscrito') {
        return (
            <div className="min-h-screen bg-[#F5F7F8] flex items-center justify-center p-6">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Você já está inscrito</h1>
                    <p className="text-gray-600 mb-8">Você já possui uma inscrição ativa para esta turma.</p>
                    <Link href="/minha-area" className="block w-full py-3 bg-[#1A3C4A] text-white rounded-md font-bold hover:bg-[#2E6B7A] transition-colors">
                        Ver Minhas Inscrições
                    </Link>
                    <Link href="/" className="block w-full py-3 mt-3 text-[#2E6B7A] font-medium hover:bg-gray-50 rounded-md transition-colors border border-gray-200">
                        Voltar para o Início
                    </Link>
                </div>
            </div>
        )
    }

    const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all bg-white text-gray-800 text-sm"
    const labelClass = "block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5"

    return (
        <div className="min-h-screen bg-[#F5F7F8] py-12 px-6">
            <div className="max-w-2xl mx-auto">
                <Link href={`/${tipo === 'curso' ? 'cursos' : 'atividades'}/${id}`} className="inline-flex items-center gap-2 text-[#2E6B7A] hover:text-[#1A3C4A] mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" /> Voltar para os detalhes
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-[#1A3C4A] p-8 text-white">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#2D9E6B] mb-2 block">
                            Formulário de Inscrição
                        </span>
                        <h1 className="text-2xl md:text-3xl font-bold">{entidade?.titulo || 'Carregando...'}</h1>
                        {tipo === 'curso' && turma?.data_inicio && (
                            <p className="text-white/60 text-sm mt-2">
                                {new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}
                                {turma.data_fim && ` até ${new Date(turma.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}`}
                            </p>
                        )}
                        {tipo === 'atividade' && entidade?.datas?.[0]?.data && (
                            <p className="text-white/60 text-sm mt-2 flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                {new Date(entidade.datas[0].data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                {entidade.datas[0].hora_inicio && ` · ${entidade.datas[0].hora_inicio}`}
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleInscricao} className="p-8 space-y-6">
                        {statusInscricao === 'erro' && (
                            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                                <strong>Erro:</strong> {errorMessage}
                            </div>
                        )}

                        {/* Campos de contato */}
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>E-mail *</label>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className={inputClass}
                                    placeholder="seu@email.com"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    WhatsApp
                                    {!whatsapp && <span className="ml-1 text-[10px] normal-case font-normal text-gray-400">(usado para confirmação)</span>}
                                </label>
                                <input
                                    type="tel"
                                    value={whatsapp}
                                    onChange={e => setWhatsapp(e.target.value)}
                                    className={inputClass}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        {/* Campos do formulário personalizado */}
                        {formulario.length > 0 && (
                            <div className="space-y-5">
                                {formulario.map(campo => (
                                    <div key={campo.id}>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            {campo.label}
                                            {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
                                            {campo.is_whatsapp && <span className="ml-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">usado para confirmação no WhatsApp</span>}
                                        </label>
                                        <CampoInput
                                            campo={campo}
                                            value={respostas[campo.id] || ''}
                                            onChange={v => setRespostas(prev => ({ ...prev, [campo.id]: v }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Resumo curso */}
                        {formulario.length === 0 && turma && tipo === 'curso' && (
                            <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
                                <h3 className="font-semibold text-gray-800 mb-2">Resumo da Inscrição</h3>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li><strong>Modalidade:</strong> <span className="capitalize">{tipo}</span></li>
                                    <li><strong>Turma:</strong> #{turmaId?.split('-')[0]}</li>
                                    {turma?.data_inicio && <li><strong>Início:</strong> {new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</li>}
                                    {turma?.data_fim && <li><strong>Encerramento:</strong> {new Date(turma.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}</li>}
                                </ul>
                            </div>
                        )}

                        {/* Resumo atividade */}
                        {tipo === 'atividade' && entidade && (
                            <div className="rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Resumo da Atividade</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {entidade.tipo && (
                                        <div className="flex items-center gap-3 px-6 py-4">
                                            <Tag className="w-4 h-4 text-[var(--secondary)] flex-shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tipo</p>
                                                <p className="text-sm font-bold text-[#1A3C4A] capitalize">{entidade.tipo}</p>
                                            </div>
                                        </div>
                                    )}
                                    {entidade.datas?.length > 0 && (
                                        <div className="flex items-start gap-3 px-6 py-4">
                                            <CalendarDays className="w-4 h-4 text-[var(--secondary)] flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Datas</p>
                                                <ul className="space-y-1.5">
                                                    {entidade.datas.map((d: any, i: number) => (
                                                        <li key={i} className="text-sm font-bold text-[#1A3C4A]">
                                                            {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                            {d.hora_inicio && <span className="font-normal text-gray-500"> · {d.hora_inicio}{d.hora_fim ? ` às ${d.hora_fim}` : ''}</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                    {entidade.locais?.length > 0 && (
                                        <div className="flex items-start gap-3 px-6 py-4">
                                            <MapPin className="w-4 h-4 text-[var(--secondary)] flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2">Local</p>
                                                {entidade.locais.map((l: any, i: number) => (
                                                    <p key={i} className="text-sm font-bold text-[#1A3C4A]">
                                                        {l.nome || l.rua || l.endereco || 'Sede da ONG'}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {entidade.publico_alvo && (
                                        <div className="flex items-center gap-3 px-6 py-4">
                                            <Users className="w-4 h-4 text-[var(--secondary)] flex-shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Público-alvo</p>
                                                <p className="text-sm font-bold text-[#1A3C4A]">{entidade.publico_alvo}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 bg-[#2D9E6B] text-white rounded-xl font-bold text-lg shadow-sm hover:bg-green-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {submitting ? (
                                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Processando...</>
                            ) : 'Confirmar Inscrição'}
                        </button>
                        <p className="text-center text-xs text-gray-400">Ao se inscrever você concorda com os termos de participação da instituição.</p>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default function InscricaoPage({ params }: { params: { tipo: string, id: string } }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#F5F7F8] flex items-center justify-center animate-pulse"><p className="text-[#1A3C4A] font-medium uppercase text-xs tracking-widest">Carregando formulário...</p></div>}>
            <InscricaoForm params={params} />
        </Suspense>
    )
}
