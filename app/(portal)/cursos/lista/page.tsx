import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/tenant-server'
import Link from 'next/link'
import { CalendarDays, GraduationCap, Users, Search } from 'lucide-react'

export default async function CursosListaPublicaPage() {
    const supabase = createClient()
    const tenant = await getTenant()

    if (!tenant) return <div className="p-20 text-center">Organização não encontrada.</div>

    const { data: cursos } = await supabase
        .from('cursos')
        .select(`*, turmas(id, vagas, status, inscricoes(id))`)
        .eq('tenant_id', tenant.id)
        .eq('visibilidade', 'publico')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })

    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <section className="bg-[var(--primary)] text-white py-20 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 text-[var(--secondary)] font-black uppercase text-xs tracking-widest mb-4">
                        <GraduationCap className="w-4 h-4" /> Qualificação Profissional
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter mb-4">Todos os Cursos</h1>
                    <p className="text-white/60 text-lg">Explore todos os cursos disponíveis em {tenant.nome}.</p>
                </div>
            </section>

            {/* Lista de Cursos */}
            <section className="py-20 px-6 max-w-7xl mx-auto">
                {(!cursos || cursos.length === 0) ? (
                    <div className="text-center py-20 text-gray-400">
                        <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="font-bold text-lg">Nenhum curso disponível no momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {cursos.map(curso => {
                            const turmasAbertas = curso.turmas?.filter((t: any) => t.status === 'aberta') || []
                            const vagasTotais = turmasAbertas.reduce((acc: number, t: any) => acc + (t.vagas || 0), 0)
                            const inscritosTotais = turmasAbertas.reduce((acc: number, t: any) => acc + (t.inscricoes?.length || 0), 0)
                            const vagasDisponiveis = Math.max(0, vagasTotais - inscritosTotais)

                            return (
                                <div key={curso.id} className="group bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col">
                                    <div className="h-56 bg-gray-50 w-full relative overflow-hidden">
                                        {curso.thumbnail_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={curso.thumbnail_url} alt={curso.titulo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <GraduationCap className="w-12 h-12 text-gray-200" />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4">
                                            <span className="bg-white/90 backdrop-blur-md text-[var(--primary)] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                                                {curso.modalidade}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-4 left-4">
                                            <span className="bg-[var(--secondary)] text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest">
                                                {curso.categoria || 'Geral'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        <h3 className="text-xl font-black text-[#1A3C4A] mb-3 leading-tight">{curso.titulo}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-6 font-medium">{curso.descricao}</p>
                                        <div className="mt-auto space-y-4">
                                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <CalendarDays className="w-4 h-4" /> {curso.carga_horaria}h
                                                </div>
                                                <div className={`flex items-center gap-2 ${vagasDisponiveis > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    <Users className="w-4 h-4" /> {vagasDisponiveis > 0 ? `${vagasDisponiveis} vagas` : 'Esgotado'}
                                                </div>
                                            </div>
                                            <Link
                                                href={`/cursos/${curso.id}`}
                                                className="w-full py-4 bg-gray-50 text-[#1A3C4A] rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] text-center group-hover:bg-[var(--primary)] group-hover:text-white transition-all block"
                                            >
                                                Ver Detalhes e Inscrever
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}
