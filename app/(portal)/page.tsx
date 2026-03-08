import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/tenant-server'
import Link from 'next/link'
import { CalendarDays, GraduationCap, MapPin, Search, Users } from 'lucide-react'

export default async function PublicLandingPage() {
    const supabase = createClient()
    const tenant = await getTenant()

    if (!tenant) return <div className="p-20 text-center">Organização não encontrada.</div>

    // 1. Busca Cursos Publicados do Tenant
    const { data: cursos } = await supabase.from('cursos')
        .select(`
            *,
            turmas (
                id,
                vagas,
                status,
                inscricoes(id)
            )
        `)
        .eq('tenant_id', tenant.id)
        .eq('visibilidade', 'publico')
        .eq('status', 'ativo')
        .limit(6)

    // 2. Busca Atividades Publicadas do Tenant
    const { data: atividades } = await supabase.from('atividades')
        .select(`
            *,
            inscricoes(id)
        `)
        .eq('tenant_id', tenant.id)
        .eq('visibilidade', 'publico')
        .in('status', ['publicada', 'em_andamento'])
        .limit(6)

    return (
        <div className="animate-in fade-in duration-700">
            {/* Hero Section Dinâmica */}
            <section className="bg-[var(--primary)] text-white py-24 px-6 lg:px-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                <div className="max-w-4xl mx-auto space-y-8 relative z-10">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-widest mb-4">
                        Bem-vindo à {tenant.nome}
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter">
                        Inovação e <span className="text-[var(--secondary)]">Impacto Social</span> na Nossa Comunidade
                    </h1>
                    <p className="text-xl text-white/70 max-w-2xl mx-auto font-medium">
                        Explore as iniciativas da {tenant.nome}. Oferecemos cursos profissionalizantes e atividades culturais gratuitas para todos os cidadãos.
                    </p>

                    <div className="relative max-w-2xl mx-auto mt-12 group">
                        <input
                            type="text"
                            placeholder="O que você deseja aprender hoje?"
                            className="w-full pl-16 pr-8 py-6 rounded-[32px] text-gray-800 bg-white shadow-2xl shadow-black/20 focus:outline-none focus:ring-4 focus:ring-[var(--secondary)]/30 transition-all text-lg"
                        />
                        <Search className="w-8 h-8 text-gray-300 absolute left-6 top-1/2 -translate-y-1/2 group-focus-within:text-[var(--primary)] transition-colors" />
                    </div>
                </div>
            </section>

            {/* Cursos em Destaque */}
            <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-[var(--secondary)] font-black uppercase text-xs tracking-widest mb-2">
                            <GraduationCap className="w-4 h-4" /> Qualificação Profissional
                        </div>
                        <h2 className="text-4xl font-black text-[#1A3C4A]">Cursos Abertos</h2>
                    </div>
                    <Link href="/cursos/lista" className="text-sm font-black uppercase tracking-widest text-[#1A3C4A] border-b-2 border-[var(--secondary)] pb-1 hover:text-[var(--secondary)] transition-colors">
                        Ver Todos os Cursos
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {cursos?.map(curso => {
                        // Cálculo de vagas totais (soma das turmas abertas)
                        const turmasAbertas = curso.turmas?.filter((t: any) => t.status === 'aberta') || []
                        const vagasTotais = turmasAbertas.reduce((acc: number, t: any) => acc + (t.vagas || 0), 0)
                        const inscritosTotais = turmasAbertas.reduce((acc: number, t: any) => acc + (t.inscricoes?.length || 0), 0)
                        const vagasDisponiveis = Math.max(0, vagasTotais - inscritosTotais)

                        return (
                            <div key={curso.id} className="group bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col">
                                <div className="h-64 bg-gray-50 w-full relative overflow-hidden">
                                    {curso.thumbnail_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={curso.thumbnail_url} alt={curso.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 bg-gray-50">
                                            <GraduationCap className="w-12 h-12 opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-6 right-6 flex flex-col gap-2">
                                        <span className="bg-white/90 backdrop-blur-md text-[var(--primary)] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                                            {curso.modalidade}
                                        </span>
                                    </div>
                                    <div className="absolute bottom-6 left-6">
                                        <span className="bg-[var(--secondary)] text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                                            {curso.categoria || 'Geral'}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col">
                                    <h3 className="text-2xl font-black text-[#1A3C4A] mb-4 leading-tight group-hover:text-[var(--primary)] transition-colors">{curso.titulo}</h3>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-8 font-medium">{curso.descricao}</p>

                                    <div className="mt-auto space-y-6">
                                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <CalendarDays className="w-4 h-4" /> {curso.carga_horaria}h de carga
                                            </div>
                                            <div className={`flex items-center gap-2 ${vagasDisponiveis > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                <Users className="w-4 h-4" /> {vagasDisponiveis > 0 ? `${vagasDisponiveis} vagas` : 'Esgotado'}
                                            </div>
                                        </div>

                                        <Link
                                            href={`/cursos/${curso.id}`}
                                            className="w-full py-4 bg-gray-50 text-[#1A3C4A] rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] text-center group-hover:bg-[var(--primary)] group-hover:text-white transition-all shadow-sm"
                                        >
                                            Ver Detalhes
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* Atividades Próximas */}
            <section className="py-24 px-6 lg:px-12 bg-white rounded-[64px] mb-20 shadow-2xl shadow-black/5 max-w-7xl mx-auto border border-gray-50">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-[var(--primary)] font-black uppercase text-xs tracking-widest mb-2">
                            <CalendarDays className="w-4 h-4" /> Ações Comunitárias
                        </div>
                        <h2 className="text-4xl font-black text-[#1A3C4A]">Agenda Social</h2>
                    </div>
                    <Link href="/atividades/lista" className="text-sm font-black uppercase tracking-widest text-[var(--primary)] hover:text-[var(--secondary)] transition-colors">
                        Calendário Completo
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {atividades?.map(ativ => {
                        const inscritos = ativ.inscricoes?.length || 0
                        const vagasDisp = ativ.vagas ? ativ.vagas - inscritos : null

                        return (
                            <div key={ativ.id} className="flex flex-col lg:flex-row gap-8 items-start lg:items-center p-8 bg-gray-50 rounded-[40px] hover:bg-white hover:shadow-xl transition-all border border-transparent hover:border-gray-100 group">
                                <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-[32px] bg-white border border-gray-100 flex flex-col items-center justify-center flex-shrink-0 text-[var(--primary)] shadow-sm group-hover:scale-105 transition-transform">
                                    <span className="text-[10px] uppercase font-black text-gray-400 mb-1">Início</span>
                                    <span className="text-4xl font-black">--</span>
                                </div>

                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-4 mb-3">
                                        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white bg-[var(--primary)] px-3 py-1 rounded-full">{ativ.tipo}</span>
                                        {ativ.exige_inscricao && (
                                            <span className="text-[9px] uppercase font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">Inscrição Prévia</span>
                                        )}
                                        {vagasDisp !== null && (
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${vagasDisp > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {vagasDisp > 0 ? `${vagasDisp} vagas livres` : 'Esgotado'}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-3xl font-black text-[#1A3C4A] mb-3 leading-tight">{ativ.titulo}</h3>
                                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-medium">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-[var(--secondary)]" /> {ativ.locais?.[0]?.rua || 'Sede da ONG'}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4 text-[var(--secondary)]" /> {ativ.publico_alvo || 'Público Geral'}
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href={`/atividades/${ativ.id}`}
                                    className="px-10 py-5 bg-[var(--primary)] text-white text-xs font-black uppercase tracking-widest rounded-[24px] hover:bg-[var(--secondary)] transition-all shadow-lg shadow-[var(--primary)]/20 hover:shadow-[var(--secondary)]/30"
                                >
                                    Participar
                                </Link>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
