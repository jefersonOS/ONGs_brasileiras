import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { getAIProvider, extractJSON } from '@/lib/ai-service'

const CATEGORIA_CONTEXTO: Record<string, string> = {
    projeto_basico: 'Projeto Básico de uma ONG, contendo identificação, justificativa, objetivos, metodologia, cronograma e orçamento.',
    relatorio_parcial: 'Relatório Parcial de execução de projeto de ONG, com período de referência, atividades realizadas, metas alcançadas e dificuldades.',
    relatorio_final: 'Relatório Final de projeto de ONG, com resultados alcançados, metas cumpridas, impacto social e lições aprendidas.',
    prestacao_contas: 'Prestação de Contas financeira de projeto de ONG, com receitas, despesas detalhadas e saldo.',
    ata_reuniao: 'Ata de Reunião de ONG, com informações da reunião, participantes, pauta, deliberações e encaminhamentos.',
    contrato: 'Contrato entre partes envolvidas em um projeto de ONG, com objeto, valor, vigência e cláusulas.',
    outro: 'Documento genérico de ONG.',
    plano_trabalho: 'Plano de Trabalho de ONG com descrição, objetivos, justificativa, metas e cronograma.',
}

export async function POST(req: Request) {
    try {
        const { categoria, titulo, ideiaCentral } = await req.json()

        if (!ideiaCentral?.trim()) {
            return NextResponse.json({ error: 'Ideia central é obrigatória' }, { status: 400 })
        }

        // Support both keys (relatorio_parcial) and labels (Relatório Parcial)
        const contexto = CATEGORIA_CONTEXTO[categoria]
            || CATEGORIA_CONTEXTO[categoria?.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '')]
            || `Documento do tipo "${categoria}" para uma ONG brasileira.`
        const model = await getAIProvider()

        const systemPrompt = `Você é um especialista em elaboração de documentos para ONGs brasileiras (MROSC).
Gere o conteúdo de um documento do tipo: ${contexto}

REGRAS:
- Retorne APENAS JSON puro, sem markdown, sem explicações
- Use tom formal e técnico adequado a ONGs brasileiras
- Gere conteúdo realista e completo baseado na ideia central fornecida
- Para tabelas, gere 2-3 linhas de exemplo com dados coerentes
- Para listas, gere 3-5 itens relevantes

ESTRUTURA JSON a retornar:
{
  "titulo": "título do documento (string)",
  "secoes": [
    {
      "id": "id_unico_snake_case",
      "label": "Nome da seção",
      "tipo": "textarea | text | number | group | table | list",
      "descricao": "",
      "valor": "<string para text/textarea/number, array de strings para list, array de arrays para table>",
      "colunas": ["col1","col2"] (somente se tipo=table),
      "campos": [{"label":"campo","tipo":"text","valor":"conteúdo"}] (somente se tipo=group)
    }
  ]
}`

        const prompt = `Gere um ${contexto} completo para a seguinte ideia central: "${ideiaCentral}"
${titulo ? `Título desejado: "${titulo}"` : ''}

Gere seções relevantes para este tipo de documento, preenchidas com conteúdo realista e coerente com a ideia central.`

        const { text } = await generateText({
            model,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }]
        })

        const object = extractJSON(text)
        return NextResponse.json(object)
    } catch (error: any) {
        console.error('Erro ao gerar documento:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
