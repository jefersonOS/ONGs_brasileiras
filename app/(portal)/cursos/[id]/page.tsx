import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, Clock, Users, ArrowLeft, GraduationCap } from 'lucide-react'
import { notFound } from 'next/navigation'
import { BotaoInscricao } from '@/components/portal/BotaoInscricao'

export default async function CursoPublicoPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: curso } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', params.id)
        .eq('visibilidade', 'publico')
        .single()

    if (!curso) notFound()

    const today = new Date().toISOString().split('T')[0]

    const { data: turmas } = await supabase
        .from('turmas')
        .select('*, inscricoes(id, cidadao_id)')
        .eq('curso_id', params.id)
        .eq('status', 'aberta')
        .or(`data_limite_inscricao.is.null,data_limite_inscricao.gte.${today}`)

    return (
        <div className="bg-[#F5F7F8] min-h-screen pb-20 animate-in fade-in duration-500">
            {/* Header com Branding */}
            <div className="bg-gradient-to-br from-[var(--primary)] to-[#112933] text-white pt-20 pb-40 px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mt-20"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--secondary)]/10 rounded-full blur-3xl"></div>

                <div className="max-w-6xl mx-auto relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-12 transition-all text-[10px] font-black uppercase tracking-[0.2em] group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Portal
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-8">
                                <span className="bg-[var(--secondary)] text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg shadow-[var(--secondary)]/20">
                                    {curso.modalidade}
                                </span>
                                <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">
                                    {curso.categoria}
                                </span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter mb-10 text-balance">{curso.titulo}</h1>

                            <div className="flex flex-wrap gap-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                        <Clock className="w-5 h-5 text-[var(--secondary)]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none mb-1">Carga Horária</p>
                                        <p className="text-sm font-bold">{curso.carga_horaria} Horas</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                        <Users className="w-5 h-5 text-[var(--secondary)]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-white/40 uppercase font-black tracking-widest leading-none mb-1">Instrutor</p>
                                        <p className="text-sm font-bold">{curso.instrutor || 'A definir'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {curso.thumbnail_url ? (
                            <div className="hidden lg:block w-80 h-48 rounded-[40px] overflow-hidden border-8 border-white/5 shadow-2xl flex-shrink-0 rotate-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={curso.thumbnail_url}
                                    alt={curso.titulo}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-700"
                                />
                            </div>
                        ) : (
                            <div className="hidden lg:block w-80 h-48 rounded-[40px] border-4 border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="w-16 h-16 text-white/10" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="max-w-6xl mx-auto px-6 -mt-20 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                    <div className="lg:col-span-8 space-y-12">
                        {/* Sobre o Curso */}
                        <div className="bg-white rounded-[40px] p-12 shadow-2xl shadow-black/[0.03] border border-gray-100 flex flex-col md:flex-row gap-12 ring-1 ring-black/[0.01]">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6">
                                    <Clock className="w-3.5 h-3.5" /> Detalhes do Curso
                                </div>
                                <h2 className="text-3xl font-black text-[#1A3C4A] mb-8 tracking-tighter">Sobre este curso</h2>
                                <p className="text-gray-500 font-medium whitespace-pre-wrap leading-relaxed text-lg">
                                    {curso.descricao || 'Este curso oferece uma oportunidade única de aprendizado e desenvolvimento pessoal.'}
                                </p>
                            </div>
                        </div>

                        {/* Conteúdo Programático */}
                        {curso.conteudo_programatico && curso.conteudo_programatico.length > 0 && (
                            <div className="bg-white rounded-[40px] p-12 shadow-2xl shadow-black/[0.03] border border-gray-100 ring-1 ring-black/[0.01]">
                                <h2 className="text-3xl font-black text-[#1A3C4A] mb-12 tracking-tighter flex items-center gap-4">
                                    <div className="w-1.5 h-8 bg-[var(--secondary)] rounded-full"></div>
                                    O que você vai aprender
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    {curso.conteudo_programatico.map((mod: any, i: number) => (
                                        <div key={i} className="flex gap-6 group">
                                            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gray-50 text-[var(--primary)] flex items-center justify-center font-black text-xl group-hover:bg-[var(--secondary)] group-hover:text-white group-hover:scale-110 transition-all shadow-sm ring-1 ring-black/[0.03]">
                                                {(i + 1).toString().padStart(2, '0')}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-[#1A3C4A] text-lg group-hover:text-[var(--primary)] transition-all mb-2 leading-tight">{mod.modulo}</h3>
                                                <p className="text-gray-400 text-sm font-medium leading-relaxed line-clamp-2 md:line-clamp-none group-hover:text-gray-500 transition-colors">{mod.topicos}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar de Inscrição */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-black/10 border border-gray-100 lg:sticky lg:top-12">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-12 h-12 rounded-2xl bg-[var(--secondary)]/10 flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-[var(--secondary)]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-[#1A3C4A] tracking-tighter">Turmas</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Disponíveis agora</p>
                                </div>
                            </div>

                            {turmas && turmas.length > 0 ? (
                                <div className="space-y-6">
                                    {turmas.map(turma => {
                                        const myEnrol = user ? (turma.inscricoes as any[])?.find(i => i.cidadao_id === user.id) : null
                                        const currentInscritos = (turma.inscricoes as any[])?.length || 0
                                        const hasVagas = currentInscritos < (turma.vagas || 0)

                                        return (
                                            <div key={turma.id} className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 hover:border-[var(--secondary)]/30 hover:bg-white transition-all group ring-1 ring-black/[0.01]">
                                                <div className="flex justify-between items-center mb-6">
                                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.1em]">Ref: {turma.id.split('-')[0]}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.1em] px-3 py-1 rounded-full ${hasVagas ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                                        {hasVagas ? `${turma.vagas - currentInscritos} Vagas` : 'Esgotado'}
                                                    </span>
                                                </div>

                                                {turma.data_inicio && (
                                                    <div className="mb-6 space-y-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                                <span className="text-[#1A3C4A] font-black">Início:</span> {new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                            </p>
                                                        </div>
                                                        {turma.data_fim && (
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                                    <span className="text-[#1A3C4A] font-black">Fim:</span> {new Date(turma.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                                </p>
                                                            </div>
                                                        )}
                                                        {turma.data_limite_inscricao && (
                                                            <div className="pt-2 border-t border-gray-50 mt-2">
                                                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                                    Inscrições até: {new Date(turma.data_limite_inscricao + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <BotaoInscricao
                                                    tipo="curso"
                                                    entidadeId={curso.id}
                                                    turmaId={turma.id}
                                                    tenantId={curso.tenant_id}
                                                    isLogged={!!user}
                                                    isEnrolled={!!myEnrol}
                                                    inscricaoId={myEnrol?.id}
                                                    hasVacancies={hasVagas}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-16 px-10 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] leading-relaxed">Nenhuma turma aberta no momento.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
