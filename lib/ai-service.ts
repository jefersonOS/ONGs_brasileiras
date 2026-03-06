import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'

// Simulates a DB fetch of provider config. 
// For now, defaults to OpenAI or Google based on env vars available.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getAIProvider(tenantId?: string) {
    if (process.env.OPENAI_API_KEY) {
        return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })('gpt-4o')
    }
    if (process.env.GOOGLE_AI_API_KEY) {
        return createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY })('gemini-1.5-pro-latest')
    }
    if (process.env.ANTHROPIC_API_KEY) {
        return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })('claude-3-5-sonnet-20240620')
    }
    throw new Error("Nenhum provedor de IA configurado no ambiente.")
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function buildSystemPrompt(tenantId?: string, userId?: string, paginaAtual?: string) {
    return `Você é um assistente especializado em gestão de ONGs brasileiras. 
  Seu objetivo é ajudar a criar documentos formais, planos de trabalho e métricas sólidas. 
  Responda sempre em um tom profissional, orientando-se pelo Marco Regulatório das Organizações da Sociedade Civil (MROSC).`
}

export async function gerarPlanoTrabalho(ideiaCentral: string, tenantId: string) {
    const model = await getAIProvider(tenantId)

    const systemPrompt = `Você é um especialista em elaboração de projetos sociais para ONGs.
Construa um plano de trabalho completo baseado estritamente na seguinte ideia central fornecida. 
Devolva APENAS um objeto JSON válido, contendo as seguintes chaves exatas (e nenhum texto fora do JSON):
{
  "titulo": "string curta",
  "descricao": "string detalhada",
  "objetivos": "string detalhada com objetivo geral e específicos",
  "justificativa": "string detalhada",
  "metas": [{"nome": "string", "descricao": "string"}],
  "cronograma": [{"mes": "numero", "atividade": "string"}],
  "orcamento_estimado": 0.00
}`

    const { text } = await generateText({
        model,
        system: systemPrompt,
        prompt: ideiaCentral
    })

    try {
        const limpo = text.replace(/```json/g, '').replace(/```/g, '').trim()
        return JSON.parse(limpo)
    } catch {
        console.error("Failed to parse JSON from AI", text)
        throw new Error('A resposta da IA não foi um JSON válido.')
    }
}
