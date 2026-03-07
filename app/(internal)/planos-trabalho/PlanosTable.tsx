'use client'

import { DataTable, Column } from '@/components/ui/DataTable'
import Link from 'next/link'
import { Plus, Sparkles, LayoutDashboard, Download, Pencil } from 'lucide-react'

interface PlanoTrabalho extends Record<string, unknown> {
    id: string
    titulo: string
    projeto_id?: string
    projetos?: { nome: string }
    status: string
    orcamento_estimado: number
    created_at: string
}

interface PlanosTableProps {
    initialData: PlanoTrabalho[]
    userRole?: string
}

export function PlanosTable({ initialData, userRole }: PlanosTableProps) {
    const isReviewer = userRole === 'superadmin' || userRole === 'proprietario'

    const columns: Column<PlanoTrabalho>[] = [
        {
            title: 'Título',
            key: 'titulo',
            render: (row) => (
                <Link href={`/planos-trabalho/${row.id}`} className="font-bold text-[#1A3C4A] hover:underline">
                    {row.titulo}
                </Link>
            )
        },
        { title: 'Projeto', key: 'projeto_id', render: (row) => <span className="text-gray-600 font-medium">{row.projetos?.nome || '-'}</span> },
        {
            title: 'Status', key: 'status', render: (row) => {
                const colors: Record<string, string> = {
                    'rascunho': 'bg-gray-100 text-gray-500',
                    'enviado': 'bg-blue-100 text-blue-600',
                    'aprovado': 'bg-green-100 text-green-600',
                    'rejeitado': 'bg-red-100 text-red-600'
                }
                return (
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${colors[row.status] || colors['rascunho']}`}>
                        {row.status}
                    </span>
                )
            }
        },
        { title: 'Orçamento', key: 'orcamento_estimado', render: (row) => <span className="font-black text-[#1A3C4A]">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.orcamento_estimado || 0)}</span> },
        {
            title: 'Ações', key: 'id', render: (row) => (
                <div className="flex justify-end gap-1">
                    {isReviewer && row.status === 'enviado' && (
                        <Link
                            href={`/planos-trabalho/${row.id}`}
                            className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                        >
                            Analisar
                        </Link>
                    )}
                    <a
                        href={`/api/planos-trabalho/${row.id}/exportar-docx`}
                        download
                        title="Baixar DOCX"
                        className="p-1.5 text-gray-400 hover:text-[#2D9E6B] transition-colors"
                    >
                        <Download className="w-4 h-4" />
                    </a>
                    <Link
                        href={`/planos-trabalho/${row.id}/editar`}
                        title="Editar"
                        className="p-1.5 text-gray-400 hover:text-[#1A3C4A] transition-colors"
                    >
                        <Pencil className="w-4 h-4" />
                    </Link>
                    <Link
                        href={`/planos-trabalho/${row.id}`}
                        title="Ver detalhes"
                        className="p-1.5 text-gray-400 hover:text-[#1A3C4A] transition-colors"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                    </Link>
                </div>
            )
        }
    ]

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#1A3C4A] tracking-tighter">Planos de Trabalho</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Gestão de metas e cronogramas institucionais</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/planos-trabalho/novo?ai=true" className="bg-white border border-gray-100 text-[#1A3C4A] px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-gray-50 transition-all shadow-xl shadow-black/5 text-[10px] font-black uppercase tracking-widest">
                        <Sparkles className="w-4 h-4 text-[#2D9E6B]" /> Gerar com IA
                    </Link>
                    <Link href="/planos-trabalho/novo" className="bg-[#2D9E6B] text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-green-600/20 text-[10px] font-black uppercase tracking-widest">
                        <Plus className="w-4 h-4" /> Novo Plano
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-[40px] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden">
                <DataTable
                    columns={columns}
                    data={initialData}
                    searchable
                    searchKey="titulo"
                    searchPlaceholder="Buscar por título do plano..."
                    emptyMessage="Nenhum plano de trabalho criado."
                />
            </div>
        </div>
    )
}
