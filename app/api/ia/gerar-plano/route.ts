import { generateObject } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getAIProvider } from '@/lib/ai-service'

export const maxDuration = 60

const PlanoSchema = z.object({
    titulo: z.string(),
    descricao: z.string(),
    objetivos: z.string(),
    justificativa: z.string(),
    publico_alvo: z.string(),
    metas: z.array(z.object({
        descricao: z.string(),
        indicador: z.string(),
        prazo: z.string()
    })),
    cronograma: z.array(z.object({
        fase: z.string(),
        atividades: z.string(),
        inicio: z.string(),
        fim: z.string()
    })),
    orcamento_estimado: z.number()
})

export async function POST(req: Request) {
    try {
        const { ideiaCentral } = await req.json()
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return new Response('Unauthorized', { status: 401 })

        const model = await getAIProvider()

        const { object } = await generateObject({
            model: model as any,
            schema: PlanoSchema,
            mode: 'json',
            messages: [
                {
                    role: 'system',
                    content: `Você é uma IA especialista em elaboração de Planos de Trabalho para ONGs brasileiras (MROSC). 
                    Responda estritamente com um objeto JSON válido seguindo o esquema fornecido. 
                    Não inclua nenhuma outra explicação ou texto.`
                },
                {
                    role: 'user',
                    content: `Gere um Plano de Trabalho completo para a seguinte ideia central: "${ideiaCentral}"`
                }
            ]
        })

        return Response.json(object)
    } catch (error: any) {
        console.error('Erro ao gerar plano:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
