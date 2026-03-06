import { createClient } from '@/lib/supabase/server'
import { DataTable, Column } from '@/components/ui/DataTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function PrestacoesContasPage() {
    const supabase = createClient()

    interface PrestacaoContas extends Record<string, unknown> {
        id: string
        titulo: string
        periodo_mes: number
        periodo_ano: number
        plano_id?: string
        planos_trabalho?: { titulo: string }
        status: string
        created_at: string
    }

    const { data: prestacoes } = await supabase
        .from('prestacoes_contas')
        .select(`
            *,
            planos_trabalho ( titulo )
        `)
        .order('created_at', { ascending: false })

    const columns: Column<PrestacaoContas>[] = [
        { title: 'Título', key: 'titulo', render: (row) => <span className="font-medium">{row.titulo}</span> },
        { title: 'Plano de Trabalho', key: 'plano_id', render: (row) => <span className="text-gray-600">{row.planos_trabalho?.titulo || '-'}</span> },
        { title: 'Período', key: 'periodo_mes', render: (row) => <span className="text-gray-600">{row.periodo_mes ? `${String(row.periodo_mes).padStart(2, '0')}/${row.periodo_ano}` : '-'}</span> },
        {
            title: 'Status', key: 'status', render: (row) => {
                const colors: Record<string, string> = {
                    'rascunho': 'bg-gray-100 text-gray-700',
                    'enviado': 'bg-blue-100 text-blue-700',
                    'aprovado': 'bg-green-100 text-green-700',
                    'rejeitado': 'bg-red-100 text-red-700'
                }
                const st = String(row.status)
                return (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[st] || colors['rascunho']}`}>
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                    </span>
                )
            }
        },
        { title: 'Criado em', key: 'created_at', render: (row) => new Date(String(row.created_at)).toLocaleDateString() }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Prestações de Contas</h1>
                    <p className="text-gray-500 mt-1">Gerencie os relatórios e comprovantes vinculados aos planos.</p>
                </div>
                <Link href="/prestacoes-contas/novo" className="bg-[#2D9E6B] hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Nova Prestação
                </Link>
            </div>

            <DataTable
                columns={columns}
                data={prestacoes || []}
                searchable
                searchKey="titulo"
                searchPlaceholder="Buscar por título..."
                emptyMessage="Nenhuma prestação de contas cadastrada."
            />
        </div>
    )
}
