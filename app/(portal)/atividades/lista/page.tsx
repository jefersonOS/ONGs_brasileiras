import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/tenant-server'
import Link from 'next/link'
import { CalendarDays, MapPin, Users } from 'lucide-react'

export default async function AtividadesListaPublicaPage() {
    const supabase = createClient()
    const tenant = await getTenant()

    if (!tenant) return <div className="p-20 text-center">Organização não encontrada.</div>

    const { data: atividades } = await supabase
        .from('atividades')
        .select(`*, inscricoes(id)`)
        .eq('tenant_id', tenant.id)
        .eq('visibilidade', 'publico')
        .in('status', ['publicada', 'em_andamento'])
        .order('created_at', { ascending: false })

    return (
        <div className="animate-in fade-in duration-700">
            {/* Header */}
            <section className="bg-[var(--primary)] text-white py-20 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 text-[var(--secondary)] font-black uppercase text-xs tracking-widest mb-4">
                        <CalendarDays className="w-4 h-4" /> Agenda Social
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter mb-4">Todas as Atividades</h1>
                    <p className="text-white/60 text-lg">Confira a agenda completa de {tenant.nome}.</p>
                </div>
            </section>

            {/* Lista de Atividades */}
            <section className="py-20 px-6 max-w-5xl mx-auto">
                {(!atividades || atividades.length === 0) ? (
                    <div className="text-center py-20 text-gray-400">
                        <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p className="font-bold text-lg">Nenhuma atividade disponível no momento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {atividades.map(ativ => {
                            const inscritos = ativ.inscricoes?.length || 0
                            const vagasDisp = ativ.vagas ? ativ.vagas - inscritos : null

                            return (
                                <div key={ativ.id} className="flex flex-col lg:flex-row gap-8 items-start lg:items-center p-8 bg-white rounded-[40px] hover:shadow-xl transition-all border border-gray-100 group">
                                    <div className="w-24 h-24 rounded-[28px] bg-[var(--primary)]/5 flex flex-col items-center justify-center flex-shrink-0 text-[var(--primary)] group-hover:bg-[var(--primary)]/10 transition-colors">
                                        <CalendarDays className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white bg-[var(--primary)] px-3 py-1 rounded-full">{ativ.tipo}</span>
                                            {ativ.exige_inscricao && (
                                                <span className="text-[9px] uppercase font-black text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">Inscrição Prévia</span>
                                            )}
                                            {vagasDisp !== null && (
                                                <span className={`text-[9px] font-black uppercase ${vagasDisp > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {vagasDisp > 0 ? `${vagasDisp} vagas` : 'Esgotado'}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-2xl font-black text-[#1A3C4A] mb-2 leading-tight">{ativ.titulo}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 font-medium">
                                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-[var(--secondary)]" />{ativ.locais?.[0]?.rua || 'Sede da ONG'}</span>
                                            <span className="flex items-center gap-1"><Users className="w-4 h-4 text-[var(--secondary)]" />{ativ.publico_alvo || 'Público Geral'}</span>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/atividades/${ativ.id}`}
                                        className="px-8 py-4 bg-[var(--primary)] text-white text-xs font-black uppercase tracking-widest rounded-[20px] hover:bg-[var(--secondary)] transition-all shrink-0"
                                    >
                                        Participar
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}
