'use client'

import React, { useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'

export interface Column<T> {
    key: keyof T | string
    title: string
    render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    searchable?: boolean
    searchPlaceholder?: string
    searchKey?: keyof T
    onRowClick?: (item: T) => void
    emptyMessage?: string
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    searchable = false,
    searchPlaceholder = 'Buscar...',
    searchKey,
    onRowClick,
    emptyMessage = 'Nenhum registro encontrado.'
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    // Filter
    const filteredData = searchable && searchKey && searchTerm
        ? data.filter(item =>
            String(item[searchKey]).toLowerCase().includes(searchTerm.toLowerCase())
        )
        : data

    // Pagination
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    return (
        <div className="bg-white border text-sm border-gray-200 rounded-lg shadow-sm w-full overflow-hidden">
            {searchable && (
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className="bg-transparent border-none focus:ring-0 outline-none flex-1 text-gray-700"
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value)
                            setCurrentPage(1)
                        }}
                    />
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            {columns.map((col, i) => (
                                <th key={String(col.key) + i} className="px-6 py-3 font-semibold text-gray-600">
                                    {col.title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, idx) => (
                                <tr
                                    key={item.id || idx}
                                    onClick={() => onRowClick && onRowClick(item)}
                                    className={`group transition-colors ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/50'}`}
                                >
                                    {columns.map((col, cIdx) => (
                                        <td key={String(col.key) + cIdx} className="px-6 py-4 whitespace-nowrap text-gray-700">
                                            {col.render ? col.render(item) : item[col.key as keyof T]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 text-gray-600 flex items-center justify-between bg-gray-50">
                    <span>Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
