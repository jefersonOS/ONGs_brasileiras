'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function InscricaoPage({ params }: { params: { tipo: string, id: string } }) {
    const { tipo, id } = params
    const searchParams = useSearchParams()
    const turmaId = searchParams.get('turma')

    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState<any>(null)
    const [entidade, setEntidade] = useState<any>(null)
    const [turma, setTurma] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [statusInscricao, setStatusInscricao] = useState<'idle' | 'sucesso' | 'erro' | 'ja_inscrito'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        const fetchContext = async () => {
            setLoading(true)
            const { data: { user: currentUser } } = await supabase.auth.getUser()

            if (currentUser) {
                setUser(currentUser)

                // Verifica se já está inscrito
                let query = supabase.from('inscricoes').select('id').eq('cidadao_id', currentUser.id).eq('entidade_id', id)
                if (turmaId) query = query.eq('turma_id', turmaId)

                const { data: inscricaoExistente } = await query.single()

                if (inscricaoExistente) {
                    setStatusInscricao('ja_inscrito')
                    setLoading(false)
                    return
                }
            }

            // Busca os detalhes do curso ou atividade
            if (tipo === 'curso') {
                const { data: c } = await supabase.from('cursos').select('titulo, modalidade').eq('id', id).single()
                setEntidade(c)
                if (turmaId) {
                    const { data: t } = await supabase.from('turmas').select('vagas, encontros').eq('id', turmaId).single()
                    setTurma(t)
                }
            } else if (tipo === 'atividade') {
                const { data: a } = await supabase.from('atividades').select('titulo, tipo, exige_inscricao, vagas').eq('id', id).single()
                setEntidade(a)
            }

            setLoading(false)
        }

        fetchContext()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tipo, id, turmaId])

    const handleInscricao = async () => {
        setSubmitting(true)

        if (!user) {
            router.push(`/login?redirectTo=/inscricao/${tipo}/${id}${turmaId ? `?turma=${turmaId}` : ''}`)
            return
        }

        const { data: { user: currentUser } } = await supabase.auth.getUser()

        const res = await fetch('/api/inscricao/confirmar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo,
                id,
                turmaId: turmaId || null,
                cidadaoId: user.id,
                tenantId: currentUser?.user_metadata?.tenant_id
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
                    <p className="text-[#1A3C4A] font-medium">Preparando ambiente seguro...</p>
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
                        Parabéns! Sua vaga em <strong>{entidade?.titulo}</strong> foi reservada com sucesso. Você receberá mais detalhes em breve.
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
                    <p className="text-gray-600 mb-8">
                        O sistema detectou que você já possui uma inscrição ativa para esta atividade ou turma.
                    </p>
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

    return (
        <div className="min-h-screen bg-[#F5F7F8] py-12 px-6">
            <div className="max-w-2xl mx-auto">
                <Link href={`/${tipo === 'curso' ? 'cursos' : 'atividades'}/${id}`} className="inline-flex items-center gap-2 text-[#2E6B7A] hover:text-[#1A3C4A] mb-8 transition-colors text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" /> Voltar para os detalhes
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-[#1A3C4A] p-8 text-white">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#2D9E6B] mb-2 block">
                            Nova Inscrição
                        </span>
                        <h1 className="text-2xl md:text-3xl font-bold">{entidade?.titulo || 'Carregando...'}</h1>
                    </div>

                    <div className="p-8">
                        {statusInscricao === 'erro' && (
                            <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                                <strong>Erro ao processar inscrição:</strong> {errorMessage}
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="border border-gray-100 rounded-lg p-5 bg-gray-50">
                                <h3 className="font-semibold text-gray-800 mb-2">Resumo da Inscrição</h3>
                                <ul className="text-sm text-gray-600 space-y-2">
                                    <li><strong>Modalidade:</strong> <span className="capitalize">{tipo}</span></li>
                                    {turma && <li><strong>Turma:</strong> #{turmaId?.split('-')[0]}</li>}
                                    {turma && turma.encontros?.length > 0 && (
                                        <li><strong>Início Previsto:</strong> {new Date(turma.encontros[0].data).toLocaleDateString()}</li>
                                    )}
                                </ul>
                            </div>

                            <div className="border border-teal-100 rounded-lg p-5 bg-teal-50">
                                <h3 className="font-semibold text-[#1A3C4A] mb-2">Seus Dados</h3>
                                {user ? (
                                    <div className="text-sm text-[#2E6B7A]">
                                        <p>Você está logado como: <strong>{user.user_metadata?.nome || user.email}</strong></p>
                                        <p className="mt-1">A inscrição será vinculada permanentemente ao seu perfil.</p>
                                    </div>
                                ) : (
                                    <div className="text-sm text-[#2E6B7A]">
                                        <p>Para prosseguir com a inscrição de forma segura, você precisará fazer o seu login ou realizar um rápido cadastro (se for o primeiro acesso).</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-10">
                            <button
                                onClick={handleInscricao}
                                disabled={submitting}
                                className="w-full py-4 bg-[#2D9E6B] text-white rounded-lg font-bold text-lg shadow-sm hover:bg-green-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processando...
                                    </>
                                ) : (
                                    user ? 'Confirmar Participação Agora' : 'Fazer Login para Continuar'
                                )}
                            </button>
                            <p className="text-center text-xs text-gray-400 mt-4">Ao se inscrever você concorda com os termos de participação da instituição.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
