import { createClient } from '@/lib/supabase/server'
import { DataTable, Column } from '@/components/ui/DataTable'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'

export default async function AtividadesPage() {
    const supabase = createClient()

    interface Atividade extends Record<string, unknown> {
        id: string
        titulo: string
        tipo: string
        visibilidade: string
        vagas: number
        status: string
        created_at: string
    }

    const { data: atividades } = await supabase
        .from('atividades')
        .select('*')
        .order('created_at', { ascending: false })

    const columns: Column<Atividade>[] = [
        { title: 'Atividade', key: 'titulo', render: (row) => <span className="font-medium text-[#1A3C4A]">{row.titulo}</span> },
        { title: 'Tipo', key: 'tipo', render: (row) => <span className="capitalize text-gray-600">{row.tipo}</span> },
        { title: 'Vagas', key: 'vagas', render: (row) => <span className="text-gray-600">{row.vagas ? row.vagas : 'Sem limite'}</span> },
        { title: 'Visibilidade', key: 'visibilidade', render: (row) => <span className="capitalize text-gray-600">{row.visibilidade}</span> },
        {
            title: 'Status', key: 'status', render: (row) => {
                const colors: Record<string, string> = {
                    'rascunho': 'bg-gray-100 text-gray-700',
                    'publicada': 'bg-blue-100 text-blue-700',
                    'em_andamento': 'bg-green-100 text-green-700',
                    'encerrada': 'bg-gray-200 text-gray-800',
                    'cancelada': 'bg-red-100 text-red-700'
                }
                const st = String(row.status || 'rascunho')
                return (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[st] || colors['rascunho']}`}>
                        {st.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </span>
                )
            }
        },
        {
            title: 'Ações',
            key: 'id',
            render: (row) => (
                <Link href={`/atividades/presencas/${row.id}`} className="text-[#2D9E6B] hover:underline flex items-center gap-1 text-sm font-medium">
                    <Users className="w-4 h-4" /> Presenças
                </Link>
            )
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Atividades</h1>
                    <p className="text-gray-500 mt-1">Gerencie eventos, campanhas, e atividades esportivas ou culturais.</p>
                </div>
                <Link href="/atividades/novo" className="bg-[#2D9E6B] hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Nova Atividade
                </Link>
            </div>

            <DataTable
                columns={columns}
                data={atividades || []}
                searchable
                searchKey="titulo"
                searchPlaceholder="Buscar atividade por título..."
                emptyMessage="Nenhuma atividade cadastrada."
            />
        </div>
    )
}
