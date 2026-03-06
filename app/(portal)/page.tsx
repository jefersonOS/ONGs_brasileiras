import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarDays, GraduationCap, MapPin, Search } from 'lucide-react'

export default async function PublicLandingPage() {
    const supabase = createClient()

    // Real world: we would filter by tenant. Assuming global or single-tenant for now.
    const { data: cursos } = await supabase.from('cursos')
        .select('*')
        .eq('visibilidade', 'publico')
        .eq('status', 'ativo')
        .limit(6)

    const { data: atividades } = await supabase.from('atividades')
        .select('*')
        .eq('visibilidade', 'publico')
        .in('status', ['publicada', 'em_andamento'])
        .limit(6)

    return (
        <div>
            {/* Hero Section */}
            <section className="bg-[#1A3C4A] text-white py-20 px-6 lg:px-12 text-center">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight">Conectando Cidadãos às Iniciativas da Nossa Comunidade</h1>
                    <p className="text-lg text-gray-300">Descubra cursos, oficinas e atividades oferecidas gratuitamente. Inscreva-se e participe do desenvolvimento social da sua região.</p>

                    <div className="relative max-w-xl mx-auto mt-8">
                        <input
                            type="text"
                            placeholder="Buscar por cursos ou atividades..."
                            className="w-full pl-12 pr-4 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-[#2D9E6B]/50"
                        />
                        <Search className="w-6 h-6 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                </div>
            </section>

            {/* Cursos */}
            <section className="py-16 px-6 lg:px-12 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-[#1A3C4A] flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-[#2D9E6B]" /> Cursos em Destaque
                    </h2>
                    <Link href="/cursos" className="text-sm font-medium text-[#2E6B7A] hover:underline">Ver todos os cursos</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {cursos?.map(curso => (
                        <div key={curso.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="h-48 bg-gray-200 w-full relative">
                                {/* Placeholder for thumbnail */}
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100">Sem Imagem</div>
                                <span className="absolute top-4 right-4 bg-[#2D9E6B] text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                                    {curso.modalidade}
                                </span>
                            </div>
                            <div className="p-6">
                                <span className="text-xs font-medium text-[#2E6B7A] uppercase tracking-wider">{curso.categoria || 'Geral'}</span>
                                <h3 className="text-lg font-bold text-gray-800 mt-2 mb-3 leading-tight">{curso.titulo}</h3>
                                <p className="text-sm text-gray-500 line-clamp-3 mb-4">{curso.descricao}</p>
                                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">{curso.carga_horaria} horas</span>
                                    <Link href={`/cursos/${curso.id}`} className="text-sm font-semibold text-[#1A3C4A] hover:text-[#2D9E6B]">Saber mais &rarr;</Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(!cursos || cursos.length === 0) && (
                        <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            Nenhum curso público disponível no momento.
                        </div>
                    )}
                </div>
            </section>

            {/* Atividades */}
            <section className="py-16 px-6 lg:px-12 max-w-7xl mx-auto bg-white rounded-3xl mb-12 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-[#1A3C4A] flex items-center gap-2">
                        <CalendarDays className="w-6 h-6 text-[#2E6B7A]" /> Próximas Atividades
                    </h2>
                    <Link href="/atividades" className="text-sm font-medium text-[#2E6B7A] hover:underline">Ver agenda completa</Link>
                </div>

                <div className="space-y-4">
                    {atividades?.map(ativ => (
                        <div key={ativ.id} className="flex flex-col md:flex-row gap-6 items-start md:items-center p-6 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors group">
                            <div className="w-16 h-16 rounded-lg bg-[#F5F7F8] border border-gray-200 flex flex-col items-center justify-center flex-shrink-0 text-[#1A3C4A]">
                                {/* Fake date logic for demo since we store complex dates */}
                                <span className="text-xs uppercase font-bold text-gray-500">Mês</span>
                                <span className="text-xl font-black">--</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#2E6B7A] px-2 py-0.5 rounded">{ativ.tipo}</span>
                                    {ativ.exige_inscricao && <span className="text-[10px] uppercase font-bold text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded">Requer Inscrição</span>}
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#1A3C4A] transition-colors">{ativ.titulo}</h3>
                                <p className="text-sm text-gray-500 line-clamp-1 mt-1">{ativ.descricao}</p>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto mt-4 md:mt-0">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <MapPin className="w-4 h-4" /> Vários Locais
                                </div>
                                <Link href={`/atividades/${ativ.id}`} className="w-full md:w-auto px-6 py-2 bg-[#2D9E6B] text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors text-center">
                                    Detalhes
                                </Link>
                            </div>
                        </div>
                    ))}
                    {(!atividades || atividades.length === 0) && (
                        <div className="py-8 text-center text-gray-500">
                            Nenhuma atividade agendada.
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
