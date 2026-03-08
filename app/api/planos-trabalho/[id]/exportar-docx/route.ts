import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
    AlignmentType, WidthType, BorderStyle, ShadingType,
    Header, VerticalAlign
} from 'docx'

const DARK = '1A3C4A'
const LIGHT_GRAY = 'F2F2F2'
const BORDER = { style: BorderStyle.SINGLE, size: 6, color: DARK }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const TABLE_WIDTH = { size: 9638, type: WidthType.DXA }

function parseSecoes(val: string | null): any[] | null {
    if (!val) return null
    try {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) ? parsed : null
    } catch { return null }
}

// Linha de título da seção (fundo escuro, texto branco em negrito)
function sectionTitleRow(label: string, colspan = 1): TableRow {
    return new TableRow({
        children: [
            new TableCell({
                columnSpan: colspan,
                children: [new Paragraph({
                    children: [new TextRun({ text: label, bold: true, color: 'FFFFFF', size: 22 })],
                    spacing: { before: 60, after: 60 },
                })],
                shading: { type: ShadingType.CLEAR, fill: DARK },
                borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                width: TABLE_WIDTH,
            }),
        ],
    })
}

// Linha de conteúdo simples (fundo branco)
function contentRow(text: string, colspan = 1, minHeight = 800): TableRow {
    return new TableRow({
        height: { value: minHeight, rule: 'atLeast' as any },
        children: [
            new TableCell({
                columnSpan: colspan,
                children: [new Paragraph({
                    children: [new TextRun({ text: text || '', size: 22 })],
                    spacing: { before: 80, after: 80 },
                })],
                borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                width: TABLE_WIDTH,
            }),
        ],
    })
}

// Linha de dois campos lado a lado (label: valor | label: valor)
function twoColRow(fields: { label: string; value: string }[]): TableRow {
    const cols = fields.slice(0, 2)
    return new TableRow({
        children: cols.map(f => new TableCell({
            children: [new Paragraph({
                children: [
                    new TextRun({ text: `${f.label}: `, bold: true, size: 20 }),
                    new TextRun({ text: f.value || '', size: 20 }),
                ],
                spacing: { before: 60, after: 60 },
            })],
            borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
            width: { size: Math.floor(9638 / cols.length), type: WidthType.DXA },
        })),
    })
}

// Linha de um campo (label em negrito + valor)
function singleFieldRow(label: string, value: string): TableRow {
    return new TableRow({
        children: [
            new TableCell({
                children: [new Paragraph({
                    children: [
                        new TextRun({ text: `${label}: `, bold: true, size: 20 }),
                        new TextRun({ text: value || '', size: 20 }),
                    ],
                    spacing: { before: 60, after: 60 },
                })],
                borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
                width: TABLE_WIDTH,
            }),
        ],
    })
}

// Cabeçalho de tabela (fundo cinza claro)
function tableHeaderRow(columns: string[]): TableRow {
    return new TableRow({
        children: columns.map(col => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: col, bold: true, size: 20 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 },
            })],
            shading: { type: ShadingType.CLEAR, fill: LIGHT_GRAY },
            borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
            width: { size: Math.floor(9638 / columns.length), type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
        })),
    })
}

// Linha de dados de tabela
function tableDataRow(cells: string[], columns: number): TableRow {
    return new TableRow({
        height: { value: 500, rule: 'atLeast' as any },
        children: cells.map(cell => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: cell || '', size: 20 })],
                spacing: { before: 60, after: 60 },
            })],
            borders: { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER },
            width: { size: Math.floor(9638 / columns), type: WidthType.DXA },
        })),
    })
}

function spacer(): Paragraph {
    return new Paragraph({ text: '', spacing: { after: 120 } })
}

function buildTable(rows: TableRow[]): Table {
    return new Table({ rows, width: TABLE_WIDTH })
}

// Renderiza uma seção como bloco de tabela fiel ao template
function renderSecao(secao: any): (Table | Paragraph)[] {
    const blocks: (Table | Paragraph)[] = []

    if (secao.tipo === 'group') {
        const campos: any[] = secao.campos || []
        const rows: TableRow[] = [sectionTitleRow(secao.label, 2)]

        // Agrupa campos de 2 em 2 para layout lado a lado
        for (let i = 0; i < campos.length; i += 2) {
            const pair = campos.slice(i, i + 2)
            if (pair.length === 2) {
                rows.push(twoColRow([
                    { label: pair[0].label, value: pair[0].valor || '' },
                    { label: pair[1].label, value: pair[1].valor || '' },
                ]))
            } else {
                rows.push(singleFieldRow(pair[0].label, pair[0].valor || ''))
            }
        }

        blocks.push(buildTable(rows))

    } else if (secao.tipo === 'table') {
        const colunas: string[] = secao.colunas || []
        const linhas: string[][] = secao.valor || [[]]
        const rows: TableRow[] = [
            sectionTitleRow(secao.label, colunas.length),
            tableHeaderRow(colunas),
            ...linhas.map((row: string[]) => tableDataRow(row, colunas.length)),
        ]
        blocks.push(buildTable(rows))

    } else if (secao.tipo === 'textarea' || secao.tipo === 'text') {
        blocks.push(buildTable([
            sectionTitleRow(secao.label),
            contentRow(secao.valor || '', 1, secao.tipo === 'textarea' ? 1200 : 600),
        ]))

    } else if (secao.tipo === 'number') {
        blocks.push(buildTable([
            sectionTitleRow(secao.label),
            contentRow(secao.valor ? `R$ ${Number(secao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''),
        ]))

    } else if (secao.tipo === 'list') {
        const items: string[] = Array.isArray(secao.valor) ? secao.valor : []
        blocks.push(buildTable([
            sectionTitleRow(secao.label),
            contentRow(items.join('\n') || ''),
        ]))
    }

    blocks.push(spacer())
    return blocks
}

function buildRegularContent(plano: any): (Table | Paragraph)[] {
    const blocks: (Table | Paragraph)[] = []

    const sections = [
        { label: 'Descrição', value: plano.descricao, tipo: 'textarea' },
        { label: 'Objetivos', value: plano.objetivos, tipo: 'textarea' },
        { label: 'Justificativa', value: plano.justificativa, tipo: 'textarea' },
        { label: 'Orçamento Estimado', value: plano.orcamento_estimado ? `R$ ${Number(plano.orcamento_estimado).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '', tipo: 'text' },
    ]

    for (const s of sections) {
        if (s.value) {
            blocks.push(buildTable([
                sectionTitleRow(s.label),
                contentRow(s.value, 1, s.tipo === 'textarea' ? 1200 : 600),
            ]))
            blocks.push(spacer())
        }
    }

    if (Array.isArray(plano.metas) && plano.metas.length > 0) {
        blocks.push(buildTable([
            sectionTitleRow('Metas', 2),
            tableHeaderRow(['Meta', 'Descrição']),
            ...plano.metas.map((m: any) => tableDataRow([m.nome || '', m.descricao || ''], 2)),
        ]))
        blocks.push(spacer())
    }

    if (Array.isArray(plano.cronograma) && plano.cronograma.length > 0) {
        blocks.push(buildTable([
            sectionTitleRow('Cronograma Físico', 2),
            tableHeaderRow(['Mês', 'Atividade']),
            ...plano.cronograma.map((c: any) => tableDataRow([c.mes || '', c.atividade || ''], 2)),
        ]))
        blocks.push(spacer())
    }

    return blocks
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

        const bodyContent: (Table | Paragraph)[] = [
            new Paragraph({
                children: [new TextRun({ text: 'PLANO DE TRABALHO', bold: true, size: 32, color: DARK })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 160 },
            }),
            new Paragraph({
                children: [new TextRun({ text: plano.titulo, size: 24, color: DARK })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }),
            ...(secoes ? secoes.flatMap(renderSecao) : buildRegularContent(plano)),
            spacer(),
            spacer(),
            new Paragraph({
                children: [new TextRun({ text: '___________________________', size: 22 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 800, after: 80 },
            }),
            new Paragraph({
                children: [new TextRun({ text: 'Assinatura', size: 20, color: '666666' })],
                alignment: AlignmentType.CENTER,
            }),
        ]

        const doc = new Document({
            numbering: { config: [] },
            sections: [{
                properties: {},
                headers: {
                    default: new Header({
                        children: [new Paragraph({
                            children: [new TextRun({ text: `${plano.tenants?.nome || ''} — PLANO DE TRABALHO`, size: 18, color: '888888' })],
                            alignment: AlignmentType.RIGHT,
                        })],
                    }),
                },
                children: bodyContent,
            }],
        })

        const buffer = await Packer.toBuffer(doc)
        const uint8 = new Uint8Array(buffer)
        const filename = `plano-trabalho-${plano.titulo.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.docx`

        return new NextResponse(uint8, {
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
