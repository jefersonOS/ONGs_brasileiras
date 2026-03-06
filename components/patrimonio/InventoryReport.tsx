'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// Define styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#fff',
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        borderBottom: 2,
        borderBottomColor: '#1A3C4A',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1A3C4A',
    },
    subtitle: {
        fontSize: 10,
        color: '#666',
        marginTop: 4,
    },
    summarySection: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 15,
    },
    summaryCard: {
        flex: 1,
        padding: 10,
        backgroundColor: '#F8FAFC',
        borderRadius: 5,
        border: 1,
        borderColor: '#E2E8F0',
    },
    summaryLabel: {
        fontSize: 8,
        color: '#64748B',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1A3C4A',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#1A3C4A',
        padding: 8,
        borderRadius: 3,
        marginBottom: 5,
    },
    tableHeaderCell: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: 1,
        borderBottomColor: '#EDF2F7',
        paddingVertical: 8,
        alignItems: 'center',
    },
    tableCell: {
        fontSize: 8,
        color: '#4A5568',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        borderTop: 1,
        borderTopColor: '#EDF2F7',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pageNumber: {
        fontSize: 8,
        color: '#CBD5E0',
    },
})

interface Bem {
    tombamento: string
    descricao: string
    categoria: string
    valor_atual: number
    status: string
    localizacao: string
}

export const InventoryReport = ({ bens, ongNome }: { bens: Bem[], ongNome: string }) => {
    const totalValor = bens.reduce((sum, b) => sum + (b.valor_atual || 0), 0)
    const totalItens = bens.length
    const emManutencao = bens.filter(b => b.status === 'manutencao').length

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Relatório de Inventário Patrimonial</Text>
                        <Text style={styles.subtitle}>{ongNome} | Gerado em {new Date().toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* Summary */}
                <View style={styles.summarySection}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Total de Itens</Text>
                        <Text style={styles.summaryValue}>{totalItens}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Valor Total do Inventário</Text>
                        <Text style={styles.summaryValue}>R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Em Manutenção</Text>
                        <Text style={styles.summaryValue}>{emManutencao}</Text>
                    </View>
                </View>

                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <View style={[styles.tableHeaderCell, { width: '15%' }]}><Text>Tombamento</Text></View>
                    <View style={[styles.tableHeaderCell, { width: '40%' }]}><Text>Descrição</Text></View>
                    <View style={[styles.tableHeaderCell, { width: '15%' }]}><Text>Categoria</Text></View>
                    <View style={[styles.tableHeaderCell, { width: '15%' }]}><Text>Localização</Text></View>
                    <View style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}><Text>Valor Atual</Text></View>
                </View>

                {/* Table Rows */}
                {bens.map((bem, i) => (
                    <View key={i} style={styles.tableRow}>
                        <View style={{ width: '15%' }}><Text style={styles.tableCell}>{bem.tombamento}</Text></View>
                        <View style={{ width: '40%' }}><Text style={styles.tableCell}>{bem.descricao}</Text></View>
                        <View style={{ width: '15%' }}><Text style={styles.tableCell}>{bem.categoria}</Text></View>
                        <View style={{ width: '15%' }}><Text style={styles.tableCell}>{bem.localizacao || '-'}</Text></View>
                        <View style={{ width: '15%', textAlign: 'right' }}>
                            <Text style={styles.tableCell}>R$ {bem.valor_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                        </View>
                    </View>
                ))}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.subtitle}>Nexori Platform - Gestão Transparente</Text>
                    <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
                </View>
            </Page>
        </Document>
    )
}
