'use client'

import React from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { FileText, Printer } from 'lucide-react'
import { InventoryReport } from './InventoryReport'
import { AssetLabel } from './AssetLabel'

interface ExportButtonsProps {
    bens: any[]
    ongNome: string
}

export const ExportButtons = ({ bens, ongNome }: ExportButtonsProps) => {
    return (
        <div className="flex gap-2">
            <PDFDownloadLink
                document={<InventoryReport bens={bens} ongNome={ongNome} />}
                fileName="inventario-patrimonial.pdf"
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm text-sm"
            >
                {({ loading }) => (
                    <>
                        <FileText className="w-4 h-4" />
                        {loading ? 'Preparando...' : 'Exportar Relatório'}
                    </>
                )}
            </PDFDownloadLink>
        </div>
    )
}

export const LabelButton = ({ bem }: { bem: any }) => {
    return (
        <PDFDownloadLink
            document={<AssetLabel bem={bem} />}
            fileName={`etiqueta-${bem.tombamento}.pdf`}
            className="text-[#2D9E6B] hover:text-green-700 p-1 hover:bg-teal-50 rounded transition-colors"
            title="Imprimir Etiqueta"
        >
            {({ loading }) => (
                <Printer className={loading ? "w-4 h-4 animate-pulse" : "w-4 h-4"} />
            )}
        </PDFDownloadLink>
    )
}
