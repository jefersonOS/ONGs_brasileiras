import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { generateText } from 'ai'
import { getAIProvider, extractJSON } from '@/lib/ai-service'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const uint8Array = new Uint8Array(buffer)

        const model = await getAIProvider()
        const modelId = (model as any)?.modelId || ''
        const isGemini = modelId.includes('gemini')

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

        // Só enviar arquivo se for Gemini. Se for outro modelo (como GPT), enviamos apenas o texto se for DOCX
        if (isGemini && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
            promptContent.push({
                type: 'file',
                data: uint8Array,
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
        } else if (!isGemini && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
            return NextResponse.json({ error: 'Processamento de PDF nativo requer o modelo Gemini. Por favor, mude o modelo nas configurações ou use um arquivo DOCX.' }, { status: 400 })
        } else {
            return NextResponse.json({ error: 'Formato de arquivo não suportado ou incompatível com o modelo selecionado.' }, { status: 400 })
        }

        const { text } = await generateText({
            model,
            system: 'Você é um assistente que extrai estruturas de documentos para formulários. Responda APENAS com JSON puro.',
            messages: [
                {
                    role: 'user',
                    content: promptContent
                }
            ]
        })

        const object = extractJSON(text)
        return NextResponse.json(object)
    } catch (error: any) {
        console.error('Erro ao estruturar plano:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
