import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { CalendarDays, MapPin, Users, ArrowLeft, Info } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function AtividadePublicaPage({ params }: { params: { id: string } }) {
    const supabase = createClient()

    const { data: atividade } = await supabase
        .from('atividades')
        .select('*')
        .eq('id', params.id)
        .eq('visibilidade', 'publico')
        .single()

    if (!atividade) {
        notFound()
    }

    const requiresSubscription = atividade.exige_inscricao
    const canSubscribe = atividade.status === 'publicada' || atividade.status === 'em_andamento'

    return (
        <div className="bg-[#F5F7F8] min-h-screen pb-20">
            {/* Header / Hero */}
            <div className="bg-white border-b border-gray-200 pt-12 pb-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-[#2E6B7A] hover:text-[#1A3C4A] mb-6 transition-colors text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" /> Voltar para o portal
                    </Link>
                    <div className="flex items-center gap-3 mb-4">
                        <span className="bg-[#2E6B7A] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {atividade.tipo}
                        </span>
                        {requiresSubscription && (
                            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                                <Info className="w-3 h-3" /> Requer Inscrição
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">{atividade.titulo}</h1>
                    <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                        {atividade.publico_alvo && (
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-[#2E6B7A]" /> Público: {atividade.publico_alvo}
                            </div>
                        )}
                        <div className="flex items-center gap-2 capitalize">
                            Status: <strong className={atividade.status === 'cancelada' ? 'text-red-600' : 'text-[#2D9E6B]'}>{atividade.status.replace('_', ' ')}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Sobre a Atividade</h2>
                            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                                {atividade.descricao || 'Nenhuma descrição detalhada fornecida.'}
                            </p>
                        </div>
                    </div>

                    {/* Sidebar / Info */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Informações</h3>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Datas</h4>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        {atividade.datas && atividade.datas.length > 0 ? atividade.datas.map((d: any, i: number) => (
                                            <li key={i}>{new Date(d.data).toLocaleDateString()} ({d.hora_inicio} às {d.hora_fim})</li>
                                        )) : <li>A definir</li>}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-2 mt-4 flex items-center gap-2"><MapPin className="w-4 h-4" /> Locais</h4>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        {atividade.locais && atividade.locais.length > 0 ? atividade.locais.map((l: any, i: number) => (
                                            <li key={i}><strong>{l.nome}</strong>{l.endereco ? ` - ${l.endereco}` : ''}</li>
                                        )) : <li>A definir</li>}
                                    </ul>
                                </div>

                                {atividade.vagas && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-600"><strong>{atividade.vagas}</strong> vagas disponíveis</p>
                                    </div>
                                )}
                            </div>

                            {requiresSubscription ? (
                                canSubscribe ? (
                                    <Link
                                        href={`/inscricao/atividade/${atividade.id}`}
                                        className="block w-full text-center py-3 bg-[#2D9E6B] text-white rounded-md font-bold hover:bg-green-600 transition-colors shadow-sm"
                                    >
                                        Garantir Vaga
                                    </Link>
                                ) : (
                                    <div className="p-3 text-center bg-gray-100 rounded-md text-sm text-gray-500 font-medium">
                                        Inscrições Indisponíveis
                                    </div>
                                )
                            ) : (
                                <div className="p-4 bg-teal-50 border border-teal-100 rounded-md text-center text-sm text-[#2E6B7A] font-medium">
                                    Atividade de livre acesso. Não é necessário se inscrever.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
