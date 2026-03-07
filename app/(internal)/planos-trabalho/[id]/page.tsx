'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    FileText, ArrowLeft,
    MessageSquare, DollarSign, Calendar,
    Clock, LayoutDashboard, Target, ShieldCheck
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DetalhePlanoRevisaoPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const router = useRouter()
    const { id } = params

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [plano, setPlano] = useState<any>(null)
    const [parecerText, setParecerText] = useState('')
    const [isReviewer, setIsReviewer] = useState(false)

    const fetchData = useCallback(async () => {
        // Obter usuário para checar role e tenant
        const { data: { user } } = await supabase.auth.getUser()

        // Obter Plano
        const { data, error } = await supabase
            .from('planos_trabalho')
            .select('*, tenants(nome), projetos(nome)')
            .eq('id', id)
            .single()

        if (error) {
            console.error(error)
        } else {
            setPlano(data)
            if (data.parecer_tecnico) setParecerText(data.parecer_tecnico)

            // Autorização de revisão:
            // - Super Admin
            // - Proprietário do mesmo Tenant
            const role = user?.user_metadata?.role
            const tenantId = user?.user_metadata?.tenant_id
            const permissoes = user?.user_metadata?.permissoes || {}

            setIsReviewer(
                role === 'superadmin' ||
                (role === 'proprietario' && data.tenant_id === tenantId) ||
                (permissoes.aprovar_planos === true && data.tenant_id === tenantId)
            )
        }
        setLoading(false)
    }, [id, supabase])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleReview = async (newStatus: string) => {
        if (!isReviewer) {
            alert('Você não tem permissão para revisar este plano.')
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/planos-trabalho/revisar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planoId: id, status: newStatus, parecer: parecerText })
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Erro ao processar revisão')
            }

            alert(`Plano ${newStatus === 'aprovado' ? 'aprovado' : 'rejeitado'} com sucesso!`)
            router.push('/planos-trabalho')
            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase text-xs">Carregando plano...</div>
    if (!plano) return <div className="p-20 text-center text-red-500 font-black uppercase text-xs tracking-widest">Plano não encontrado</div>

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Nav & Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <button onClick={() => router.back()} className="text-xs font-black uppercase text-[#2D9E6B] hover:underline flex items-center gap-1 mb-4 transition-all">
                        <ArrowLeft className="w-3 h-3" /> Voltar
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-3xl bg-[#1A3C4A] text-white flex items-center justify-center shadow-2xl">
                            <FileText className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-[#1A3C4A] tracking-tighter italic leading-none">{plano.titulo}</h1>
                            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                                <LayoutDashboard className="w-3 h-3" /> Instituição: {plano.tenants?.nome} • <Calendar className="w-3 h-3" /> Criado em: {new Date(plano.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {isReviewer && plano.status === 'enviado' && (
                    <div className="flex gap-4 self-end md:self-auto">
                        <button
                            onClick={() => handleReview('rejeitado')}
                            disabled={saving}
                            className="px-6 py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                        >
                            Rejeitar
                        </button>
                        <button
                            onClick={() => handleReview('aprovado')}
                            disabled={saving}
                            className="px-6 py-4 bg-[#2D9E6B] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-green-600/20 hover:scale-105 transition-all disabled:opacity-50"
                        >
                            {saving ? 'Processando...' : 'Aprovar Plano'}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    {/* Status Card */}
                    <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${plano.status === 'aprovado' ? 'bg-green-50 text-green-500' :
                            plano.status === 'enviado' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-500'
                            }`}>
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Status Atual do Processo</p>
                            <p className="text-xl font-black text-[#1A3C4A] capitalize">{plano.status}</p>
                        </div>
                    </div>

                    {/* Descrição e Detalhes */}
                    <div className="bg-white rounded-[40px] border border-gray-50 p-8 shadow-sm space-y-8">
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A] mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" /> Descrição Geral
                            </h3>
                            <p className="text-gray-600 leading-relaxed">{plano.descricao || 'Sem descrição.'}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A] mb-4 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-purple-500" /> Objetivos
                                </h3>
                                <p className="text-gray-600 text-sm whitespace-pre-wrap">{plano.objetivos || 'Não informados.'}</p>
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A] mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-orange-500" /> Justificativa
                                </h3>
                                <p className="text-gray-600 text-sm whitespace-pre-wrap">{plano.justificativa || 'Não informada.'}</p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Orçamento Estimado</p>
                                    <p className="text-lg font-black text-[#1A3C4A]">R$ {plano.orcamento_estimado?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                            {plano.projetos && (
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Projeto Vinculado</p>
                                    <p className="text-sm font-bold text-[#1A3C4A]">{plano.projetos.nome}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metas e Cronograma */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A] mb-6">Metas Estabelecidas</h3>
                            <div className="space-y-4">
                                {plano.metas?.map((meta: any, i: number) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex-shrink-0 flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                                        <div>
                                            <p className="font-bold text-sm text-[#1A3C4A]">{meta.nome}</p>
                                            <p className="text-xs text-gray-500">{meta.descricao}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#1A3C4A] mb-6">Cronograma Físico</h3>
                            <div className="space-y-4">
                                {plano.cronograma?.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center border-b border-gray-50 pb-2">
                                        <span className="text-[10px] font-black uppercase text-gray-400">Mês {item.mes}</span>
                                        <span className="text-sm font-medium text-gray-600">{item.atividade}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Revisão */}
                <div className="space-y-6">
                    <div className="bg-[#1A3C4A] p-8 rounded-[40px] text-white shadow-2xl shadow-blue-900/20">
                        <h3 className="text-xs font-black uppercase tracking-widest opacity-50 mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Parecer do Revisor
                        </h3>
                        <div className="space-y-4">
                            <textarea
                                value={parecerText}
                                onChange={e => setParecerText(e.target.value)}
                                disabled={plano.status !== 'enviado' || !isReviewer}
                                placeholder="Descreva os pontos de correção ou a justificativa da aprovação..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-[#2D9E6B]/50 min-h-[200px] text-white placeholder:text-white/20"
                            ></textarea>

                            {plano.status === 'enviado' && isReviewer && (
                                <p className="text-[10px] text-[#2D9E6B] font-bold">Instrução: Adicione o parecer antes de tomar uma decisão final.</p>
                            )}

                            {plano.status !== 'enviado' && (
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-[10px] font-black uppercase opacity-40 mb-1">Parecer Registrado</p>
                                    <p className="text-xs italic text-gray-300">&quot;{plano.parecer_tecnico || 'Sem parecer registrado.'}&quot;</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-[40px] space-y-4 border border-gray-100">
                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Informações de Auditoria</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-gray-400 font-bold">Criado em:</span>
                                <span className="text-[#1A3C4A] font-black">{new Date(plano.created_at).toLocaleString()}</span>
                            </div>
                            {plano.revisado_em && (
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-gray-400 font-bold">Revisado em:</span>
                                    <span className="text-[#1A3C4A] font-black">{new Date(plano.revisado_em).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-[10px]">
                                <span className="text-gray-400 font-bold">Gerado por IA:</span>
                                <span className={`font-black uppercase ${plano.gerado_por_ia ? 'text-green-600' : 'text-gray-400'}`}>
                                    {plano.gerado_por_ia ? 'Sim' : 'Não'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
