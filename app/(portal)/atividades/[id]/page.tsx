import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarDays, MapPin, Users, ArrowLeft, Info } from 'lucide-react'
import { notFound } from 'next/navigation'
import { BotaoInscricao } from '@/components/portal/BotaoInscricao'

export default async function AtividadePublicaPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: atividade } = await supabase
        .from('atividades')
        .select('*, inscricoes(id, cidadao_id)')
        .eq('id', params.id)
        .eq('visibilidade', 'publico')
        .single()

    if (!atividade) notFound()

    const requiresSubscription = atividade.exige_inscricao
    const canSubscribe = atividade.status === 'publicada' || atividade.status === 'em_andamento'

    // Verificamos se o usuário já está inscrito nesta atividade
    const myEnrol = user ? (atividade.inscricoes as any[])?.find(i => i.cidadao_id === user.id) : null
    const currentInscritos = (atividade.inscricoes as any[])?.length || 0
    const hasVagas = !atividade.vagas || currentInscritos < atividade.vagas

    return (
        <div className="bg-[#F5F7F8] min-h-screen pb-20 animate-in fade-in duration-500">
            {/* Header com Branding */}
            <div className="bg-white border-b border-gray-100 pt-16 pb-20 px-6 relative overflow-hidden">
                <div className="max-w-5xl mx-auto relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-[#1A3C4A]/60 hover:text-[var(--primary)] mb-10 transition-colors text-xs font-black uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4" /> Voltar ao Portal
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-[var(--primary)] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                                    {atividade.tipo}
                                </span>
                                {requiresSubscription && (
                                    <span className="bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-2">
                                        <Info className="w-3 h-3" /> Inscrição Necessária
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black text-[#1A3C4A] leading-tight tracking-tighter mb-8">{atividade.titulo}</h1>
                            <div className="flex flex-wrap gap-8 text-sm font-bold text-gray-500">
                                {atividade.publico_alvo && (
                                    <div className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-[var(--secondary)]" /> Público: {atividade.publico_alvo}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 uppercase tracking-widest text-[10px]">
                                    Status: <strong className={atividade.status === 'cancelada' ? 'text-red-600' : 'text-green-600'}>{atividade.status.replace('_', ' ')}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="max-w-5xl mx-auto px-6 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    <div className="lg:col-span-2 space-y-10">
                        <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-black/5 border border-gray-100">
                            <h2 className="text-2xl font-black text-[#1A3C4A] mb-6 tracking-tight">O que é esta atividade?</h2>
                            <p className="text-gray-500 font-medium whitespace-pre-wrap leading-relaxed text-lg">
                                {atividade.descricao || 'Nenhuma descrição detalhada fornecida.'}
                            </p>
                        </div>
                    </div>

                    {/* Sidebar / Info */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-[40px] p-8 shadow-2xl shadow-black/10 border border-gray-100 sticky top-24">
                            <h3 className="text-xl font-black text-[#1A3C4A] mb-8">Informações Gerais</h3>

                            <div className="space-y-8 mb-10">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-[0.2em] flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-[var(--primary)]" /> Quando acontece
                                    </h4>
                                    <ul className="text-sm font-bold text-[#1A3C4A] space-y-3">
                                        {atividade.datas && atividade.datas.length > 0 ? atividade.datas.map((d: any, i: number) => (
                                            <li key={i} className="flex flex-col">
                                                <span>{new Date(d.data).toLocaleDateString('pt-BR')}</span>
                                                <span className="text-gray-400 font-medium text-xs">{d.hora_inicio} às {d.hora_fim}</span>
                                            </li>
                                        )) : <li className="text-gray-400 font-medium">Aguardando definição de datas</li>}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 mb-4 tracking-[0.2em] flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[var(--primary)]" /> Onde acontece
                                    </h4>
                                    <ul className="text-sm font-bold text-[#1A3C4A] space-y-3">
                                        {atividade.locais && atividade.locais.length > 0 ? atividade.locais.map((l: any, i: number) => (
                                            <li key={i} className="flex flex-col">
                                                <strong>{l.nome}</strong>
                                                <span className="text-gray-400 font-medium text-xs">{l.endereco}</span>
                                            </li>
                                        )) : <li className="text-gray-400 font-medium">Local a definir</li>}
                                    </ul>
                                </div>

                                {atividade.vagas && (
                                    <div className="pt-6 border-t border-gray-100">
                                        <p className="text-xs font-black uppercase tracking-widest text-[#1A3C4A]">
                                            Disponibilidade: <span className={hasVagas ? 'text-green-600' : 'text-red-500'}>{hasVagas ? `${atividade.vagas - currentInscritos} vagas` : 'ESGOTADO'}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {requiresSubscription ? (
                                canSubscribe ? (
                                    <BotaoInscricao
                                        tipo="atividade"
                                        entidadeId={atividade.id}
                                        isLogged={!!user}
                                        isEnrolled={!!myEnrol}
                                        inscricaoId={myEnrol?.id}
                                        hasVacancies={hasVagas}
                                    />
                                ) : (
                                    <div className="p-6 text-center bg-gray-50 rounded-[24px] text-xs font-black uppercase text-gray-400 tracking-widest border border-dashed border-gray-200">
                                        Inscrições encerradas
                                    </div>
                                )
                            ) : (
                                <div className="p-6 bg-[var(--secondary)]/10 border border-[var(--secondary)]/20 rounded-[24px] text-center text-[var(--secondary)] font-black text-xs uppercase tracking-widest leading-relaxed">
                                    Entrada Livre
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
