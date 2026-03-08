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
            <div className="bg-[var(--primary)] text-white pt-16 pb-32 px-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-10 transition-colors text-xs font-black uppercase tracking-widest">
                        <ArrowLeft className="w-4 h-4" /> Voltar ao Portal
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-[var(--secondary)] text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                                    {curso.modalidade}
                                </span>
                                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                                    {curso.categoria}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter mb-8">{curso.titulo}</h1>
                            <div className="flex flex-wrap gap-8 text-sm font-bold">
                                <div className="flex items-center gap-2 text-white/70">
                                    <Clock className="w-5 h-5 text-[var(--secondary)]" /> {curso.carga_horaria} Horas
                                </div>
                                <div className="flex items-center gap-2 text-white/70">
                                    <Users className="w-5 h-5 text-[var(--secondary)]" /> {curso.instrutor || 'Instrutor a definir'}
                                </div>
                            </div>
                        </div>

                        {curso.thumbnail_url ? (
                            <div className="hidden md:block w-72 h-44 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={curso.thumbnail_url}
                                    alt={curso.titulo}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="hidden md:block w-72 h-44 rounded-3xl border-4 border-white/10 flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="w-16 h-16 text-white/20" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="max-w-5xl mx-auto px-6 -mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                    <div className="lg:col-span-2 space-y-10">
                        <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-black/5 border border-gray-100">
                            <h2 className="text-2xl font-black text-[#1A3C4A] mb-6 tracking-tight">Sobre este curso</h2>
                            <p className="text-gray-500 font-medium whitespace-pre-wrap leading-relaxed text-lg">
                                {curso.descricao || 'Este curso oferece uma oportunidade única de aprendizado e desenvolvimento pessoal.'}
                            </p>
                        </div>

                        {curso.conteudo_programatico && curso.conteudo_programatico.length > 0 && (
                            <div className="bg-white rounded-[40px] p-10 shadow-2xl shadow-black/5 border border-gray-100">
                                <h2 className="text-2xl font-black text-[#1A3C4A] mb-10 tracking-tight">O que você vai aprender</h2>
                                <div className="grid grid-cols-1 gap-8">
                                    {curso.conteudo_programatico.map((mod: any, i: number) => (
                                        <div key={i} className="flex gap-6 group">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gray-50 text-[var(--primary)] flex items-center justify-center font-black text-lg group-hover:bg-[var(--secondary)] group-hover:text-white transition-all shadow-sm">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-[#1A3C4A] text-xl group-hover:text-[var(--primary)] transition-colors">{mod.modulo}</h3>
                                                <p className="text-gray-500 font-medium mt-2 leading-relaxed">{mod.topicos}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar de Inscrição */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-[40px] p-8 shadow-2xl shadow-black/10 border border-gray-100 sticky top-24">
                            <h3 className="text-xl font-black text-[#1A3C4A] mb-8 flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-[var(--secondary)]" /> Turmas Disponíveis
                            </h3>

                            {turmas && turmas.length > 0 ? (
                                <div className="space-y-6">
                                    {turmas.map(turma => {
                                        const myEnrol = user ? (turma.inscricoes as any[])?.find(i => i.cidadao_id === user.id) : null
                                        const currentInscritos = (turma.inscricoes as any[])?.length || 0
                                        const hasVagas = currentInscritos < (turma.vagas || 0)

                                        return (
                                            <div key={turma.id} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-[var(--secondary)] transition-all group">
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Turma Ref: {turma.id.split('-')[0]}</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${hasVagas ? 'text-green-600' : 'text-red-500'}`}>
                                                        {hasVagas ? `${turma.vagas - currentInscritos} Vagas` : 'Esgotado'}
                                                    </span>
                                                </div>

                                                {turma.data_inicio && (
                                                    <div className="mb-4 space-y-1">
                                                        <p className="text-xs font-bold text-gray-500">
                                                            <span className="text-[#1A3C4A]">Início:</span> {new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                        </p>
                                                        {turma.data_fim && (
                                                            <p className="text-xs font-bold text-gray-500">
                                                                <span className="text-[#1A3C4A]">Encerramento:</span> {new Date(turma.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                            </p>
                                                        )}
                                                        {turma.data_limite_inscricao && (
                                                            <p className="text-xs font-bold text-amber-600">
                                                                Inscrições até: {new Date(turma.data_limite_inscricao + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <BotaoInscricao
                                                    tipo="curso"
                                                    entidadeId={curso.id}
                                                    turmaId={turma.id}
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
                                <div className="text-center py-12 px-6 bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest leading-relaxed">Nenhuma turma aberta no momento.</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
