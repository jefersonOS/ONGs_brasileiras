'use client'

import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
    page: {
        padding: 5,
        width: 150, // 5cm approximately
        height: 100, // 3cm approximately
        backgroundColor: '#fff',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        border: 1,
        borderColor: '#000',
        height: '100%',
    },
    qrSection: {
        width: '40%',
    },
    infoSection: {
        width: '60%',
        paddingLeft: 4,
    },
    tombamento: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    descricao: {
        fontSize: 6,
        color: '#333',
    },
    logo: {
        position: 'absolute',
        top: 2,
        right: 2,
        fontSize: 4,
        color: '#999',
    },
})

export const AssetLabel = ({ bem }: { bem: any }) => {
    return (
        <Document>
            <Page size={[150, 100]} style={styles.page}>
                <View style={styles.container}>
                    <View style={styles.qrSection}>
                        {bem.qrcode_url && <Image src={bem.qrcode_url} alt="QR Code" />}
                    </View>
                    <View style={styles.infoSection}>
                        <Text style={styles.tombamento}>{bem.tombamento}</Text>
                        <Text style={styles.descricao}>{bem.descricao.substring(0, 40)}...</Text>
                        <Text style={styles.logo}>PATRIMÔNIO NEXORI</Text>
                    </View>
                </View>
            </Page>
        </Document>
    )
}
