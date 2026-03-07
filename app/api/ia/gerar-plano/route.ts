import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai-service'

export const maxDuration = 60

export async function POST(req: Request) {
    try {
        const { ideiaCentral } = await req.json()
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return new Response('Unauthorized', { status: 401 })

        const model = await getAIProvider()

        const { text } = await generateText({
            model: model as any,
            system: `Você é uma IA especialista em elaboração de Planos de Trabalho para ONGs brasileiras (MROSC). 
            Responda estritamente com um objeto JSON válido. Não inclua Markdown, não inclua explicações, apenas o JSON puro.
            Estrutura esperada:
            {
              "titulo": "string",
              "descricao": "string",
              "objetivos": "string",
              "justificativa": "string",
              "publico_alvo": "string",
              "metas": [{"descricao": "string", "indicador": "string", "prazo": "string"}],
              "cronograma": [{"fase": "string", "atividades": "string", "inicio": "string", "fim": "string"}],
              "orcamento_estimado": number
            }`,
            prompt: `Gere um Plano de Trabalho completo para a seguinte ideia central: "${ideiaCentral}"`
        })

        // Extrai o JSON pelo primeiro '{' e último '}' para ignorar texto extra do modelo
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start === -1 || end === -1 || end < start) {
            throw new Error(`Resposta da IA não contém JSON válido. Texto recebido: "${text.slice(0, 200)}"`)
        }
        const object = JSON.parse(text.slice(start, end + 1))

        return Response.json(object)
    } catch (error: any) {
        console.error('Erro ao gerar plano:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
