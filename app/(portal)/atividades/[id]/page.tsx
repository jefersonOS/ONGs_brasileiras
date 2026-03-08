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
            <div className="bg-white border-b border-gray-100 pt-20 pb-40 px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mt-20"></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-[#1A3C4A]/40 hover:text-[var(--primary)] mb-12 transition-all text-[10px] font-black uppercase tracking-[0.2em] group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Portal
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-8">
                                <span className="bg-[var(--primary)] text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg shadow-[var(--primary)]/20">
                                    {atividade.tipo}
                                </span>
                                {requiresSubscription && (
                                    <span className="bg-orange-50 text-orange-600 border border-orange-100 text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5" /> Inscrição Obrigatória
                                    </span>
                                )}
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-[#1A3C4A] leading-[1.1] tracking-tighter mb-10 text-balance">{atividade.titulo}</h1>
                            <div className="flex flex-wrap gap-10 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {atividade.publico_alvo && (
                                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-gray-500">
                                        <Users className="w-4 h-4 text-[var(--secondary)]" /> {atividade.publico_alvo}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl">
                                    Status: <strong className={`ml-1 ${atividade.status === 'cancelada' ? 'text-red-600' : 'text-green-600'}`}>{atividade.status.replace('_', ' ')}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    <div className="lg:col-span-8 space-y-12">
                        <div className="bg-white rounded-[40px] p-12 shadow-2xl shadow-black/[0.03] border border-gray-100 ring-1 ring-black/[0.01]">
                            <h2 className="text-3xl font-black text-[#1A3C4A] mb-8 tracking-tighter flex items-center gap-4">
                                <div className="w-1.5 h-8 bg-[var(--primary)] rounded-full"></div>
                                O que é esta atividade?
                            </h2>
                            <p className="text-gray-500 font-medium whitespace-pre-wrap leading-relaxed text-lg italic">
                                &ldquo;{atividade.descricao || 'Nenhuma descrição detalhada fornecida.'}&rdquo;
                            </p>
                        </div>
                    </div>

                    {/* Sidebar / Info */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-black/10 border border-gray-100 lg:sticky lg:top-12">
                            <h3 className="text-xl font-black text-[#1A3C4A] mb-10 tracking-tighter">Informações Gerais</h3>

                            <div className="space-y-10">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-[0.2em] flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4 text-[var(--secondary)]" /> Datas e Horários
                                    </h4>
                                    <ul className="space-y-4">
                                        {atividade.datas && atividade.datas.length > 0 ? atividade.datas.map((d: any, i: number) => (
                                            <li key={i} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-1 transition-all hover:bg-white hover:shadow-sm">
                                                <span className="text-sm font-black text-[#1A3C4A]">{new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{d.hora_inicio} às {d.hora_fim}</span>
                                            </li>
                                        )) : <li className="text-gray-400 font-bold text-xs uppercase tracking-widest italic border-2 border-dashed border-gray-100 p-6 rounded-2xl text-center">Aguardando definição</li>}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 mb-6 tracking-[0.2em] flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-[var(--secondary)]" /> Onde acontece
                                    </h4>
                                    <ul className="space-y-4">
                                        {atividade.locais && atividade.locais.length > 0 ? atividade.locais.map((l: any, i: number) => (
                                            <li key={i} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col gap-1 transition-all hover:bg-white hover:shadow-sm">
                                                <strong className="text-sm font-black text-[#1A3C4A]">{l.nome}</strong>
                                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-relaxed">{l.endereco}</span>
                                            </li>
                                        )) : <li className="text-gray-400 font-bold text-xs uppercase tracking-widest italic border-2 border-dashed border-gray-100 p-6 rounded-2xl text-center">Local a definir</li>}
                                    </ul>
                                </div>

                                {atividade.vagas && (
                                    <div className="pt-8 border-t border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Vagas Disponíveis</p>
                                            <span className={`text-xs font-black px-3 py-1 rounded-full ${hasVagas ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                                {hasVagas ? `${atividade.vagas - currentInscritos}` : '0'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="mt-12">
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
                                    <div className="p-6 bg-gradient-to-r from-[var(--secondary)] to-[#E67E22] rounded-[24px] text-center text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[var(--secondary)]/20 shadow-orange-500/10">
                                        Entrada Livre
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    )
}
