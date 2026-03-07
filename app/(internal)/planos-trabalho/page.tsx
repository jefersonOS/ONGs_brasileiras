import { createClient } from '@/lib/supabase/server'
import { DataTable, Column } from '@/components/ui/DataTable'
import Link from 'next/link'
import { Plus, Sparkles } from 'lucide-react'

export default async function PlanosTrabalhoPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg">
                Sessão expirada. Por favor, faça login novamente.
            </div>
        )
    }

    const tenantId = user.user_metadata?.tenant_id

    interface PlanoTrabalho extends Record<string, unknown> {
        id: string
        titulo: string
        projeto_id?: string
        projetos?: { nome: string }
        status: string
        orcamento_estimado: number
        created_at: string
    }

    // In Next.js App Router we fetch data server-side
    let query = supabase.from('planos_trabalho').select(`
      *,
      projetos ( nome )
    `)

    if (tenantId) {
        query = query.eq('tenant_id', tenantId)
    }

    const { data: planos, error } = await query.order('created_at', { ascending: false })

    if (error) {
        return (
            <div className="p-8 text-center bg-orange-50 text-orange-700 rounded-lg">
                <h2 className="font-bold text-lg mb-2">Erro ao carregar planos de trabalho</h2>
                <p className="text-sm">{error.message}</p>
            </div>
        )
    }

    const columns: Column<PlanoTrabalho>[] = [
        { title: 'Título', key: 'titulo', render: (row) => <span className="font-medium">{row.titulo}</span> },
        { title: 'Projeto', key: 'projeto_id', render: (row) => <span className="text-gray-600">{row.projetos?.nome || '-'}</span> },
        {
            title: 'Status', key: 'status', render: (row) => {
                const colors: Record<string, string> = {
                    'rascunho': 'bg-gray-100 text-gray-700',
                    'enviado': 'bg-blue-100 text-blue-700',
                    'aprovado': 'bg-green-100 text-green-700',
                    'rejeitado': 'bg-red-100 text-red-700'
                }
                return (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[row.status] || colors['rascunho']}`}>
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </span>
                )
            }
        },
        { title: 'Orçamento', key: 'orcamento_estimado', render: (row) => Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.orcamento_estimado || 0) },
        { title: 'Criado em', key: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Planos de Trabalho</h1>
                    <p className="text-gray-500 mt-1">Gerencie os planos, metas e cronogramas dos projetos.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/planos-trabalho/novo?ai=true" className="bg-[#1A3C4A] hover:bg-[#2E6B7A] text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm text-sm">
                        <Sparkles className="w-4 h-4 text-[#2D9E6B]" /> Gerar com IA
                    </Link>
                    <Link href="/planos-trabalho/novo" className="bg-[#2D9E6B] hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm text-sm">
                        <Plus className="w-4 h-4" /> Novo Plano
                    </Link>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={planos || []}
                searchable
                searchKey="titulo"
                searchPlaceholder="Buscar por título do plano..."
                emptyMessage="Nenhum plano de trabalho criado."
            />
        </div>
    )
}
