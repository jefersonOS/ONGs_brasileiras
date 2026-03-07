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

        const systemPrompt = `Você é um especialista em análise de documentos. Sua tarefa é extrair a estrutura EXATA de um documento para um formulário web.

REGRAS ABSOLUTAS:
1. Preserve EXATAMENTE os títulos, numerações e hierarquias do documento original (ex: "1.1 DADOS DA ENTIDADE", "3. Objeto", "8. METAS E ATIVIDADES")
2. NÃO renomeie, NÃO resuma, NÃO agrupe seções de forma diferente do original
3. Para cada campo ou grupo de campos do documento, crie uma entrada em "secoes"

TIPOS e quando usar:
- "group": para blocos de identificação com múltiplos campos curtos (nome, CPF, endereço, etc.). Use "campos" com cada campo individual preservando o rótulo exato do documento
- "table": para tabelas com cabeçalhos e linhas (ex: Recursos Humanos, Metas, Despesas). Use "colunas" com os nomes EXATOS das colunas do documento e "valor" como array de arrays com 1 linha vazia
- "textarea": para campos de texto livre longo (justificativa, metodologia, objeto, apresentação, etc.)
- "text": para campos curtos de uma linha (tempo de execução, público-alvo, abrangência, etc.)
- "number": para valores monetários

ESTRUTURA JSON (retorne APENAS JSON puro, sem markdown):
{
  "titulo": "string (título principal do documento)",
  "secoes": [
    {
      "id": "snake_case_unico",
      "label": "EXATAMENTE como aparece no documento",
      "tipo": "group | table | textarea | text | number | list",
      "descricao": "",
      "valor": "" | [] | [[]],
      "colunas": ["col1", "col2"] (somente para tipo='table'),
      "campos": [{"id":"","label":"rótulo exato","tipo":"text|textarea|date|number","valor":""}] (somente para tipo='group')
    }
  ],
  "resumo_executivo": ""
}`

        const promptContent: any[] = [{ type: 'text', text: 'Analise este documento e extraia sua estrutura COMPLETA e FIEL conforme as instruções do sistema. Preserve todos os títulos, numerações e campos exatamente como aparecem no documento.' }]

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
