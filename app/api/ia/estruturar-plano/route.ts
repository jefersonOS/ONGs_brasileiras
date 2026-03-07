import { NextResponse } from 'next/server'
const pdf = require('pdf-parse')
import mammoth from 'mammoth'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { z } from 'zod'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        let text = ''

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            const data = await pdf(buffer)
            text = data.text
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.name.endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ buffer })
            text = result.value
        } else {
            return NextResponse.json({ error: 'Formato de arquivo não suportado. Use PDF ou DOCX.' }, { status: 400 })
        }

        if (!text || text.trim().length < 50) {
            return NextResponse.json({ error: 'Não foi possível extrair texto suficiente do arquivo.' }, { status: 400 })
        }

        // Usar AI para estruturar o plano baseado no texto extraído
        const { object } = await generateObject({
            model: google('gemini-1.5-flash'),
            schema: z.object({
                titulo: z.string(),
                secoes: z.array(z.object({
                    id: z.string(),
                    label: z.string(),
                    tipo: z.enum(['text', 'textarea', 'number', 'list']),
                    valor: z.any(),
                    descricao: z.string().optional()
                })),
                resumo_executivo: z.string()
            }),
            prompt: `Analise o seguinte texto extraído de um Plano de Trabalho de uma ONG. 
            Sua tarefa é transformar essa estrutura em um formulário web dinâmico.
            
            Crie seções (secoes) que representem os campos do documento (ex: Objetivos, Justificativa, Metas, Orçamento, etc.).
            Para listas (como cronogramas ou metas), use o tipo 'list'.
            
            TEXTO EXTRAÍDO:
            ${text.substring(0, 15000)}` // Limite para evitar estouro de tokens
        })

        return NextResponse.json(object)
    } catch (error: any) {
        console.error('Erro ao estruturar plano:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
