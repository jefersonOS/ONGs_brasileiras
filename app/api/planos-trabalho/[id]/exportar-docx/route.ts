import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    HeadingLevel, AlignmentType, WidthType, BorderStyle, ShadingType, Header
} from 'docx'

function parseSecoes(val: string | null): any[] | null {
    if (!val) return null
    try {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) ? parsed : null
    } catch { return null }
}

function heading(text: string): Paragraph {
    return new Paragraph({
        text,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
    })
}

function body(text: string): Paragraph {
    return new Paragraph({
        children: [new TextRun({ text: text || '', size: 24 })],
        spacing: { after: 120 },
    })
}

function labelValue(label: string, value: string): Paragraph {
    return new Paragraph({
        children: [
            new TextRun({ text: `${label}: `, bold: true, size: 22 }),
            new TextRun({ text: value || '—', size: 22 }),
        ],
        spacing: { after: 80 },
    })
}

function makeTable(columns: string[], rows: string[][]): Table {
    const headerRow = new TableRow({
        children: columns.map(col => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: col, bold: true, size: 20 })],
                alignment: AlignmentType.CENTER,
            })],
            shading: { type: ShadingType.CLEAR, fill: '1A3C4A', color: 'FFFFFF' },
            width: { size: Math.floor(9000 / columns.length), type: WidthType.DXA },
        })),
    })

    const dataRows = (rows || []).map(row => new TableRow({
        children: (row || []).map(cell => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: cell || '', size: 20 })],
            })],
            width: { size: Math.floor(9000 / columns.length), type: WidthType.DXA },
        })),
    }))

    return new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 9000, type: WidthType.DXA },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
        },
    })
}

function buildSecoesContent(secoes: any[]): (Paragraph | Table)[] {
    const content: (Paragraph | Table)[] = []
    for (const secao of secoes) {
        content.push(heading(secao.label))

        if (secao.tipo === 'text' || secao.tipo === 'textarea') {
            content.push(body(secao.valor || ''))
        } else if (secao.tipo === 'number') {
            content.push(body(secao.valor ? `R$ ${Number(secao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''))
        } else if (secao.tipo === 'list') {
            for (const item of (secao.valor || [])) {
                content.push(new Paragraph({
                    children: [new TextRun({ text: `• ${item}`, size: 22 })],
                    spacing: { after: 60 },
                }))
            }
        } else if (secao.tipo === 'group') {
            for (const campo of (secao.campos || [])) {
                if (campo.valor) {
                    content.push(labelValue(campo.label, campo.valor))
                }
            }
        } else if (secao.tipo === 'table') {
            if (secao.colunas?.length && secao.valor?.length) {
                content.push(makeTable(secao.colunas, secao.valor))
                content.push(new Paragraph({ text: '', spacing: { after: 100 } }))
            }
        }
    }
    return content
}

function buildRegularContent(plano: any): (Paragraph | Table)[] {
    const content: (Paragraph | Table)[] = []

    if (plano.descricao) {
        content.push(heading('Descrição'))
        content.push(body(plano.descricao))
    }
    if (plano.objetivos) {
        content.push(heading('Objetivos'))
        content.push(body(plano.objetivos))
    }
    if (plano.justificativa) {
        content.push(heading('Justificativa'))
        content.push(body(plano.justificativa))
    }
    if (plano.orcamento_estimado) {
        content.push(heading('Orçamento Estimado'))
        content.push(body(`R$ ${Number(plano.orcamento_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`))
    }
    if (Array.isArray(plano.metas) && plano.metas.length > 0) {
        content.push(heading('Metas'))
        content.push(makeTable(
            ['Meta', 'Descrição'],
            plano.metas.map((m: any) => [m.nome || '', m.descricao || ''])
        ))
        content.push(new Paragraph({ text: '', spacing: { after: 100 } }))
    }
    if (Array.isArray(plano.cronograma) && plano.cronograma.length > 0) {
        content.push(heading('Cronograma Físico'))
        content.push(makeTable(
            ['Mês', 'Atividade'],
            plano.cronograma.map((c: any) => [c.mes || '', c.atividade || ''])
        ))
    }
    return content
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = createClient()
        const { data: plano, error } = await supabase
            .from('planos_trabalho')
            .select('*, tenants(nome)')
            .eq('id', params.id)
            .single()

        if (error || !plano) {
            return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
        }

        const secoes = parseSecoes(plano.descricao)
        const bodyContent: (Paragraph | Table)[] = [
            new Paragraph({
                text: 'PLANO DE TRABALHO',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
            }),
            new Paragraph({
                children: [new TextRun({ text: plano.titulo, bold: true, size: 28 })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }),
            ...(plano.tenants?.nome ? [labelValue('Organização', plano.tenants.nome)] : []),
            ...(plano.created_at ? [labelValue('Data', new Date(plano.created_at).toLocaleDateString('pt-BR'))] : []),
            new Paragraph({ text: '', spacing: { after: 200 } }),
            ...(secoes ? buildSecoesContent(secoes) : buildRegularContent(plano)),
        ]

        const doc = new Document({
            numbering: { config: [] },
            sections: [{
                properties: {},
                headers: {
                    default: new Header({
                        children: [new Paragraph({
                            children: [new TextRun({ text: `${plano.tenants?.nome || 'Plano de Trabalho'} — ${plano.titulo}`, size: 18, color: '666666' })],
                            alignment: AlignmentType.RIGHT,
                        })],
                    }),
                },
                children: bodyContent,
            }],
        })

        const buffer = await Packer.toBuffer(doc)

        const filename = `plano-trabalho-${plano.titulo.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.docx`

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (error: any) {
        console.error('Erro ao gerar DOCX:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
