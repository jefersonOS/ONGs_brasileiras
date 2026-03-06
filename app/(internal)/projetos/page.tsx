import { createClient } from '@/lib/supabase/server'
import { DataTable, Column } from '@/components/ui/DataTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function ProjetosPage() {
    const supabase = createClient()
    const { data: projetos } = await supabase.from('projetos')
        .select('*')
        .order('created_at', { ascending: false })

    const columns: Column<any>[] = [
        { title: 'Nome', key: 'nome', render: (row) => <span className="font-medium">{row.nome}</span> },
        { title: 'Descrição', key: 'descricao', render: (row) => <span className="text-gray-500 truncate max-w-sm block">{row.descricao || '-'}</span> },
        {
            title: 'Status', key: 'status', render: (row) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${row.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {row.status === 'ativo' ? 'Ativo' : 'Arquivado'}
                </span>
            )
        },
        { title: 'Criado em', key: 'created_at', render: (row) => new Date(row.created_at).toLocaleDateString() }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Projetos</h1>
                    <p className="text-gray-500 mt-1">Gerencie os projetos desenvolvidos pela instituição.</p>
                </div>
                <Link href="/projetos/novo" className="bg-[#2D9E6B] hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors">
                    <Plus className="w-4 h-4" /> Novo Projeto
                </Link>
            </div>

            <DataTable
                columns={columns}
                data={projetos || []}
                searchable
                searchKey="nome"
                searchPlaceholder="Buscar por nome do projeto..."
                emptyMessage="Nenhum projeto encontrado. Comece criando um novo!"
            />
        </div>
    )
}
