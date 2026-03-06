import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Clock, MonitorPlay, Users, Calendar, ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function CursoPublicoPage({ params }: { params: { id: string } }) {
    const supabase = createClient()

    const { data: curso } = await supabase
        .from('cursos')
        .select('*')
        .eq('id', params.id)
        .eq('visibilidade', 'publico')
        .single()

    if (!curso) {
        notFound()
    }

    const { data: turmas } = await supabase
        .from('turmas')
        .select('*')
        .eq('curso_id', params.id)
        .eq('status', 'aberta')

    return (
        <div className="bg-[#F5F7F8] min-h-screen pb-20">
            {/* Header / Hero */}
            <div className="bg-[#1A3C4A] text-white pt-12 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-[#2D9E6B] hover:text-white mb-6 transition-colors text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Voltar para o portal
                    </Link>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-[#2D9E6B] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {curso.modalidade}
                        </span>
                        <span className="text-gray-300 text-sm uppercase tracking-wider">
                            {curso.categoria}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">{curso.titulo}</h1>
                    <div className="flex flex-wrap gap-6 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[#2D9E6B]" /> {curso.carga_horaria} horas
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#2D9E6B]" /> {curso.instrutor || 'Instrutor a definir'}
                        </div>
                        <div className="flex items-center gap-2">
                            <MonitorPlay className="w-5 h-5 text-[#2D9E6B]" /> Turmas abertas: {turmas?.length || 0}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 -mt-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Sobre o Curso</h2>
                            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                                {curso.descricao || 'Nenhuma descrição detalhada fornecida para este curso.'}
                            </p>
                        </div>

                        {curso.conteudo_programatico && curso.conteudo_programatico.length > 0 && (
                            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Conteúdo Programático</h2>
                                <div className="space-y-6">
                                    {curso.conteudo_programatico.map((mod: any, i: number) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-50 text-[#2E6B7A] flex items-center justify-center font-bold text-sm">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">{mod.modulo}</h3>
                                                <p className="text-gray-600 text-sm mt-1">{mod.topicos}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Turmas */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-24">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#2D9E6B]" /> Turmas Abertas
                            </h3>

                            {turmas && turmas.length > 0 ? (
                                <div className="space-y-4">
                                    {turmas.map(turma => (
                                        <div key={turma.id} className="border border-gray-200 rounded-lg p-4 hover:border-[#2D9E6B] transition-colors">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-gray-800">Turma #{turma.id.split('-')[0]}</span>
                                                <span className="text-xs font-medium text-gray-500">{turma.vagas} Vagas</span>
                                            </div>
                                            {turma.encontros && turma.encontros.length > 0 && (
                                                <div className="text-xs text-gray-600 mb-4">
                                                    Início: <strong>{new Date(turma.encontros[0].data).toLocaleDateString()}</strong>
                                                </div>
                                            )}
                                            <Link
                                                href={`/inscricao/curso/${curso.id}?turma=${turma.id}`}
                                                className="block w-full text-center py-2 bg-[#2D9E6B] text-white rounded-md text-sm font-medium hover:bg-green-600 transition-colors"
                                            >
                                                Inscrever-se
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                    <p className="text-sm text-gray-500">Nenhuma turma com inscrições abertas no momento.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
