import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { generateText } from 'ai'
import { getAIProvider } from '@/lib/ai-service'

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
                Retorne também um resumo executivo.
                
                RESPOSTA: OBRIGATORIAMENTE APENAS O JSON, sem markdown ou explicações.
                Estrutura: { "titulo": "string", "secoes": [{ "id": "string", "label": "string", "tipo": "text|textarea|number|list", "valor": any, "descricao": "string" }], "resumo_executivo": "string" }`
            }
        ]

        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            promptContent.push({
                type: 'file',
                data: buffer,
                mimeType: 'application/pdf'
            })
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.name.endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ buffer })
            promptContent.push({
                type: 'text',
                text: `CONTEÚDO DO ARQUIVO DOCX:\n${result.value}`
            })
        } else {
            return NextResponse.json({ error: 'Formato de arquivo não suportado. Use PDF ou DOCX.' }, { status: 400 })
        }

        const model = await getAIProvider()

        const { text } = await generateText({
            model: model as any,
            messages: [
                {
                    role: 'system',
                    content: 'Você é um assistente que extrai estruturas de documentos para formulários. Responda APENAS com JSON puro.'
                },
                {
                    role: 'user',
                    content: promptContent
                }
            ]
        })

        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const object = JSON.parse(cleanJson)

        return NextResponse.json(object)
    } catch (error: any) {
        console.error('Erro ao estruturar plano:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
