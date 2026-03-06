import { createClient } from '@/lib/supabase/server'
import { DataTable, Column } from '@/components/ui/DataTable'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'

export default async function CursosPage() {
    const supabase = createClient()

    interface Curso extends Record<string, unknown> {
        id: string
        titulo: string
        categoria: string
        modalidade: string
        instrutor: string
        carga_horaria: number
        status: string
        created_at: string
    }

    const { data: cursos } = await supabase
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: false })

    const columns: Column<Curso>[] = [
        { title: 'Curso', key: 'titulo', render: (row) => <span className="font-medium text-[#1A3C4A]">{row.titulo}</span> },
        { title: 'Categoria', key: 'categoria', render: (row) => <span className="capitalize text-gray-600">{row.categoria}</span> },
        { title: 'Carga Horária', key: 'carga_horaria', render: (row) => <span className="text-gray-600">{row.carga_horaria ? `${row.carga_horaria}h` : '-'}</span> },
        { title: 'Instrutor', key: 'instrutor', render: (row) => <span className="text-gray-600">{row.instrutor || '-'}</span> },
        {
            title: 'Modalidade', key: 'modalidade', render: (row) => (
                <span className="capitalize text-gray-600">{row.modalidade}</span>
            )
        },
        {
            title: 'Status', key: 'status', render: (row) => {
                const colors: Record<string, string> = {
                    'rascunho': 'bg-gray-100 text-gray-700',
                    'ativo': 'bg-green-100 text-green-700',
                    'encerrado': 'bg-gray-200 text-gray-800'
                }
                const st = String(row.status || 'rascunho')
                return (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[st] || colors['rascunho']}`}>
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                    </span>
                )
            }
        },
        {
            title: 'Turmas',
            key: 'id',
            render: (row) => (
                <Link href={`/cursos/turmas/${row.id}`} className="text-[#2D9E6B] hover:underline flex items-center gap-1 text-sm font-medium">
                    <Users className="w-4 h-4" /> Gerenciar Turmas
                </Link>
            )
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Cursos de Capacitação</h1>
                    <p className="text-gray-500 mt-1">Gerencie os cursos oferecidos pela ONG, turmas e cronogramas.</p>
                </div>
                <Link href="/cursos/novo" className="bg-[#2D9E6B] hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Novo Curso
                </Link>
            </div>

            <DataTable
                columns={columns}
                data={cursos || []}
                searchable
                searchKey="titulo"
                searchPlaceholder="Buscar curso por título..."
                emptyMessage="Nenhum curso cadastrado."
            />
        </div>
    )
}
