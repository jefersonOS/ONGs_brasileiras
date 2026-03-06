import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai-service'

export const maxDuration = 30

export async function POST(req: Request) {
    try {
        const { campo, valorAtual, contexto } = await req.json()
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return new Response('Unauthorized', { status: 401 })

        const model = await getAIProvider()

        const { text } = await generateText({
            model: model as any,
            system: `Você é um assistente especializado em redação técnica para ONGs.
      Sua tarefa é reescrever ou melhorar o conteúdo de um campo específico de um Plano de Trabalho.
      Mantenha um tom profissional, formal e adequado às normas do MROSC.
      Retorne APENAS o texto refinado, sem comentários ou aspas adicionais.`,
            prompt: `Refine o campo "${campo}". 
      Conteúdo atual: "${valorAtual}"
      Contexto do plano (ideia): "${contexto}"
      
      Melhore a clareza, a coesão e o vocabulário técnico.`,
        })

        return Response.json({ refinado: text.trim() })
    } catch (error: any) {
        console.error('Erro ao refinar campo:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        })
    }
}
