import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'

// Simulates a DB fetch of provider config. 
// For now, defaults to OpenAI or Google based on env vars available.
// Retorna o objeto do modelo configurado para o tenant
import { createClient } from '@/lib/supabase/server'

// Retorna o objeto do modelo configurado para o tenant
export async function getAIProvider() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let tenantConfig: any = {}

    if (user?.user_metadata?.tenant_id) {
        const { data: tenant } = await supabase
            .from('tenants')
            .select('config_portal')
            .eq('id', user.user_metadata.tenant_id)
            .single()

        if (tenant?.config_portal) {
            tenantConfig = tenant.config_portal
        }
    }

    // Determinar qual provedor usar com base no modelo ativo selecionado
    const modeloAtivo = tenantConfig.ai_modelo_ativo || 'gemini-1.5-flash' // Default para Gemini

    // OpenAI Models
    if (modeloAtivo.startsWith('gpt-')) {
        const key = tenantConfig.ai_key_openai || process.env.OPENAI_API_KEY
        if (key) {
            const openai = createOpenAI({ apiKey: key })
            return openai(modeloAtivo)
        }
    }

    // Anthropic Models
    if (modeloAtivo.startsWith('claude-')) {
        const key = tenantConfig.ai_key_claude || process.env.ANTHROPIC_API_KEY
        if (key) {
            const anthropic = createAnthropic({ apiKey: key })
            return anthropic(modeloAtivo)
        }
    }

    // Google Models
    if (modeloAtivo.startsWith('gemini-')) {
        const key = tenantConfig.ai_key_google || process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY
        if (key) {
            const google = createGoogleGenerativeAI({ apiKey: key })
            return google(modeloAtivo)
        }
    }

    // 2. Fallback de Último Caso (Tenta qualquer uma configurada se o modelo específico falhou ou não bateu no prefixo)
    if (tenantConfig.ai_key_google || process.env.GOOGLE_AI_API_KEY) {
        const key = tenantConfig.ai_key_google || process.env.GOOGLE_AI_API_KEY
        const google = createGoogleGenerativeAI({ apiKey: key! })
        return google('gemini-1.5-flash')
    }

    if (tenantConfig.ai_key_openai || process.env.OPENAI_API_KEY) {
        const key = tenantConfig.ai_key_openai || process.env.OPENAI_API_KEY
        const openai = createOpenAI({ apiKey: key! })
        return openai('gpt-4o')
    }

    throw new Error("Nenhum provedor de IA configurado ou chave correspondente não encontrada para o modelo: " + modeloAtivo)
}

/**
 * Registra uma ação da IA no log de auditoria global
 */
export async function logAIAudit(supabase: any, {
    tenantId,
    entidade,
    acao,
    dadosDepois,
    modelo = 'gpt-4o'
}: {
    tenantId: string,
    entidade: string,
    acao: string,
    dadosDepois: any,
    modelo?: string
}) {
    return await supabase.from('audit_logs').insert({
        tenant_id: tenantId,
        acao,
        entidade,
        dados_depois: dadosDepois,
        gerado_por_ia: true,
        modelo_ia: modelo
    })
}


export async function buildSystemPrompt() {
    return `Você é um assistente especializado em gestão de ONGs brasileiras. 
  Seu objetivo é ajudar a criar documentos formais, planos de trabalho e métricas sólidas. 
  Responda sempre em um tom profissional, orientando-se pelo Marco Regulatório das Organizações da Sociedade Civil (MROSC).`
}

export async function gerarPlanoTrabalho(ideiaCentral: string) {
    const model = await getAIProvider()

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
        model: model as any,
        system: systemPrompt,
        prompt: ideiaCentral
    })

    try {
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start === -1 || end === -1 || end < start) {
            throw new Error('Resposta sem JSON')
        }
        return JSON.parse(text.slice(start, end + 1))
    } catch {
        console.error("Failed to parse JSON from AI", text)
        throw new Error('A resposta da IA não foi um JSON válido.')
    }
}
