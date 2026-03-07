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
            output: 'object',
            system: `Você é uma IA especialista em elaboração de Planos de Trabalho para ONGs brasileiras, seguindo rigorosamente as diretrizes da Lei 13.019/2014 (MROSC) e do Ministério da Cidadania.
      
      Sua tarefa é gerar um plano completo e profissional baseado em uma ideia central.
      O plano deve ser estruturado, persuasivo e tecnicamente correto.
      
      ESTRUTURA:
      - Título: Nome profissional do projeto.
      - Descrição: Contextualização do projeto (2-3 parágrafos).
      - Objetivos: Objetivo Geral e pelo menos 3 Objetivos Específicos.
      - Justificativa: Por que o projeto é necessário e qual o impacto esperado.
      - Público-alvo: Quem será beneficiado diretamente.
      - Metas: Pelo menos 3 metas claras com indicadores mensuráveis.
      - Cronograma: Pelo menos 4 fases/etapas principais.
      - Orçamento: Valor total estimado.`,
            prompt: `Gere um Plano de Trabalho completo para a seguinte ideia: "${ideiaCentral}"`,
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
