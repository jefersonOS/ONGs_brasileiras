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

        const systemPrompt = `Você é um especialista em análise de documentos de ONGs brasileiras (MROSC).
Analise o documento e extraia sua estrutura como um formulário web dinâmico.

Retorne APENAS JSON puro, sem markdown. Estrutura esperada:
{
  "titulo": "string",
  "secoes": [
    {
      "id": "string (snake_case)",
      "label": "string (ex: '1.1 Dados da Entidade')",
      "tipo": "text | textarea | number | list | table | group",
      "descricao": "string (opcional, dica para o usuário)",
      "valor": "string | number | string[] | string[][]",
      "colunas": ["string"] (apenas quando tipo='table', lista de nomes das colunas),
      "campos": [ (apenas quando tipo='group', lista de campos do grupo)
        { "id": "string", "label": "string", "tipo": "text | textarea | number | date", "valor": "" }
      ]
    }
  ],
  "resumo_executivo": "string"
}

Regras:
- Use tipo='group' para subseções de identificação (dados da entidade, representante legal, responsável técnico)
- Use tipo='table' para tabelas com múltiplas colunas (recursos humanos, metas e atividades, plano de aplicação)
- Para tabelas, 'valor' deve ser um array de arrays (linhas x colunas), inicialmente com 1 linha vazia
- Use tipo='textarea' para campos de texto longo (justificativa, metodologia, apresentação, objeto, etc.)
- Use tipo='text' para campos curtos (tempo de execução, público-alvo, abrangência geográfica)
- Use tipo='number' para valores monetários (orçamento, valor da proposta)
- Preserve a numeração e hierarquia das seções do documento original`

        const promptContent: any[] = [{ type: 'text', text: 'Analise este documento de Plano de Trabalho e extraia sua estrutura conforme as instruções.' }]

        if (isGemini && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
            promptContent.push({ type: 'file', data: uint8Array, mimeType: 'application/pdf' })
        } else if (
            file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            file.name.endsWith('.docx')
        ) {
            const result = await mammoth.extractRawText({ buffer })
            promptContent.push({ type: 'text', text: `CONTEÚDO DO DOCUMENTO:\n${result.value}` })
        } else if (!isGemini && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
            return NextResponse.json({
                error: 'Para importar PDF, configure o modelo Gemini nas configurações. Para outros modelos, use o formato DOCX.'
            }, { status: 400 })
        } else {
            return NextResponse.json({ error: 'Formato não suportado. Use PDF (com Gemini) ou DOCX.' }, { status: 400 })
        }

        const { text } = await generateText({
            model,
            system: systemPrompt,
            messages: [{ role: 'user', content: promptContent }]
        })

        const object = extractJSON(text)
        return NextResponse.json(object)
    } catch (error: any) {
        console.error('Erro ao estruturar plano:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
