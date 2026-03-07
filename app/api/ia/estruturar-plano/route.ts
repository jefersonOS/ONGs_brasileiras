import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { generateObject } from 'ai'
import { getAIProvider } from '@/lib/ai-service'
import { z } from 'zod'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        const promptContent: any[] = [
            {
                type: 'text',
                text: `Analise o arquivo anexo (Plano de Trabalho de uma ONG). 
                Sua tarefa é transformar essa estrutura em um formulário web dinâmico.
                
                Crie seções (secoes) que representem os campos do documento (ex: Objetivos, Justificativa, Metas, Orçamento, etc.).
                Para listas (como cronogramas ou metas), use o tipo 'list'.
                Retorne também um resumo executivo.`
            }
        ]

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            // Enviar PDF diretamente para o Gemini (Nativo)
            promptContent.push({
                type: 'file',
                data: buffer,
                mimeType: 'application/pdf'
            })
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.name.endsWith('.docx')
        ) {
            // Para DOCX ainda extraímos texto via Mammoth
            const result = await mammoth.extractRawText({ buffer })
            promptContent.push({
                type: 'text',
                text: `CONTEÚDO DO ARQUIVO DOCX:\n${result.value}`
            })
        } else {
            return NextResponse.json({ error: 'Formato de arquivo não suportado. Use PDF ou DOCX.' }, { status: 400 })
        }

        // Usar AI para estruturar o plano
        const model = await getAIProvider()

        const { object } = await generateObject({
            model: model as any,
            mode: 'tool',
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
            messages: [
                {
                    role: 'user',
                    content: promptContent
                }
            ]
        })

        return NextResponse.json(object)
    } catch (error: any) {
        console.error('Erro ao estruturar plano:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
