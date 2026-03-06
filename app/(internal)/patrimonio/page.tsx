import { createClient } from '@/lib/supabase/server'
import { DataTable, Column } from '@/components/ui/DataTable'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function PatrimonioPage() {
    const supabase = createClient()

    interface Bem extends Record<string, unknown> {
        id: string
        tombamento: string
        descricao: string
        categoria: string
        valor_atual: number
        estado_conservacao: string
        localizacao: string
        status: string
    }

    const { data: bens } = await supabase
        .from('patrimonio_bens')
        .select('*')
        .order('created_at', { ascending: false })

    const columns: Column<Bem>[] = [
        { title: 'Tombamento', key: 'tombamento', render: (row) => <span className="font-medium text-[#2E6B7A]">{row.tombamento}</span> },
        { title: 'Descrição', key: 'descricao' },
        { title: 'Categoria', key: 'categoria', render: (row) => <span className="capitalize text-gray-600">{row.categoria}</span> },
        { title: 'Valor Atual', key: 'valor_atual', render: (row) => <span className="text-gray-600">{row.valor_atual ? `R$ ${Number(row.valor_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}</span> },
        { title: 'Localização', key: 'localizacao', render: (row) => <span className="text-gray-600">{row.localizacao || '-'}</span> },
        {
            title: 'Status', key: 'status', render: (row) => {
                const colors: Record<string, string> = {
                    'ativo': 'bg-green-100 text-green-700',
                    'manutencao': 'bg-yellow-100 text-yellow-700',
                    'baixado': 'bg-gray-100 text-gray-700'
                }
                const st = String(row.status || 'ativo')
                return (
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[st] || colors['ativo']}`}>
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                    </span>
                )
            }
        }
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Patrimônio</h1>
                    <p className="text-gray-500 mt-1">Gerencie os bens, controle o tombamento e a depreciação do patrimônio da ONG.</p>
                </div>
                <Link href="/patrimonio/novo" className="bg-[#2D9E6B] hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Cadastrar Bem
                </Link>
            </div>

            <DataTable
                columns={columns}
                data={bens || []}
                searchable
                searchKey="tombamento"
                searchPlaceholder="Buscar por número de tombamento..."
                emptyMessage="Nenhum bem cadastrado no patrimônio."
            />
        </div>
    )
}
