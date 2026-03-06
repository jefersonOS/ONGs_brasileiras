import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/ui/MetricCard'
import { FileText, ClipboardList, CheckCircle, AlertCircle, CalendarDays, Box, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
    const supabase = createClient()
    await supabase.auth.getUser()

    // If no tenant_id, just default to fetch own or tenant based on RLS (Since RLS handles visibility)
    // Let's rely on RLS doing its job.

    // Fetch Planos using multiple calls for distinct status metrics
    const { count: planosTotal } = await supabase.from('planos_trabalho').select('*', { count: 'exact', head: true })
    const { count: rascunhos } = await supabase.from('planos_trabalho').select('*', { count: 'exact', head: true }).eq('status', 'rascunho')
    const { count: enviados } = await supabase.from('planos_trabalho').select('*', { count: 'exact', head: true }).eq('status', 'enviado')
    const { count: aprovados } = await supabase.from('planos_trabalho').select('*', { count: 'exact', head: true }).eq('status', 'aprovado')

    // Extra metrics
    const { count: atividadesAtivas } = await supabase.from('atividades').select('*', { count: 'exact', head: true }).in('status', ['publicada', 'em_andamento'])
    const { count: itensPatrimonio } = await supabase.from('patrimonio_bens').select('*', { count: 'exact', head: true }).eq('status', 'ativo')

    // Prazos e Alertas
    const { data: prazos } = await supabase.from('planos_trabalho')
        .select('id, titulo, data_limite, projeto_id')
        .neq('status', 'aprovado')
        .gte('data_limite', new Date().toISOString())
        .order('data_limite', { ascending: true })
        .limit(5)

    const { data: alertas } = await supabase.from('ia_acoes_pendentes')
        .select('*')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#1A3C4A]">Bem-vindo(a) ao seu Painel</h1>
                <p className="text-gray-500 text-sm mt-1">Acompanhe as métricas e resumos da organização.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Total de Planos" value={planosTotal || 0} icon={FileText} />
                <MetricCard title="Planos em Rascunho" value={rascunhos || 0} icon={ClipboardList} />
                <MetricCard title="Planos Enviados" value={enviados || 0} icon={AlertCircle} />
                <MetricCard title="Planos Aprovados" value={aprovados || 0} icon={CheckCircle} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Atividades e Patrimônio */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <MetricCard title="Atividades Ativas" value={atividadesAtivas || 0} icon={CalendarDays} />
                        <MetricCard title="Itens de Patrimônio Ativos" value={itensPatrimonio || 0} icon={Box} />
                    </div>

                    {/* Ações Rápidas - Big Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link href="/planos-trabalho/novo" className="bg-[#1A3C4A] text-white p-4 rounded-lg flex items-center justify-between hover:bg-[#2E6B7A] transition-colors group">
                            <span className="font-medium">Criar Plano de Trabalho</span>
                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 transform" />
                        </Link>
                        <Link href="/projetos" className="bg-[#2D9E6B] text-white p-4 rounded-lg flex items-center justify-between hover:bg-green-600 transition-colors group">
                            <span className="font-medium">Gerenciar Projetos</span>
                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 transform" />
                        </Link>
                        <Link href="/logs-auditoria" className="bg-white border md:col-span-1 border-gray-200 text-[#1A3C4A] p-4 rounded-lg flex items-center justify-between hover:border-[#1A3C4A] transition-colors group">
                            <span className="font-medium">Ver Logs de Auditoria</span>
                            <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 transform" />
                        </Link>
                    </div>
                </div>

                {/* Sidebar Alertas e Prazos */}
                <div className="space-y-6">
                    {/* Alertas IA */}
                    <div className="bg-white rounded-lg shadow-sm border border-orange-200 p-6">
                        <h3 className="text-sm font-bold text-orange-700 uppercase tracking-wide flex items-center gap-2 mb-4">
                            <AlertCircle className="w-4 h-4" /> Alertas Proativos
                        </h3>
                        {alertas && alertas.length > 0 ? (
                            <div className="space-y-3">
                                {alertas.map(alerta => (
                                    <div key={alerta.id} className="p-3 bg-orange-50 rounded-md border border-orange-100">
                                        <h4 className="font-semibold text-sm text-gray-800">{alerta.titulo}</h4>
                                        <p className="text-xs text-gray-600 mt-1 mb-2">{alerta.descricao}</p>
                                        <div className="flex items-center gap-2 justify-end">
                                            <button className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded">Ignorar</button>
                                            <button className="text-xs bg-orange-600 text-white hover:bg-orange-700 px-2 py-1 rounded shadow-sm">Confirmar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Nenhum alerta pendente.</p>
                        )}
                    </div>

                    {/* Prazos */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2 mb-4">
                            <CalendarDays className="w-4 h-4" /> Próximos Prazos
                        </h3>
                        {prazos && prazos.length > 0 ? (
                            <div className="space-y-0 divide-y divide-gray-100 -mx-6">
                                {prazos.map(prazo => (
                                    <Link href={`/planos-trabalho/${prazo.id}`} key={prazo.id} className="block px-6 py-3 hover:bg-gray-50 transition-colors">
                                        <h4 className="font-medium text-sm text-gray-800 truncate">{prazo.titulo}</h4>
                                        <p className="text-xs text-gray-500 mt-1">Até: {new Date(prazo.data_limite).toLocaleDateString()}</p>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">Nenhum prazo próximo nos próximos 7 dias.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
