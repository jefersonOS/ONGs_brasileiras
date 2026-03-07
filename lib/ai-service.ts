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

    // 1. Verificar chaves específicas do Tenant (Salvas no banco)
    if (tenantConfig.ai_key_openai) {
        const openai = createOpenAI({ apiKey: tenantConfig.ai_key_openai })
        return openai(tenantConfig.ai_modelo_ativo || 'gpt-4o')
    }

    if (tenantConfig.ai_key_google) {
        const google = createGoogleGenerativeAI({ apiKey: tenantConfig.ai_key_google })
        return google(tenantConfig.ai_modelo_ativo || 'gemini-1.5-flash')
    }

    if (tenantConfig.ai_key_claude) {
        const anthropic = createAnthropic({ apiKey: tenantConfig.ai_key_claude })
        return anthropic(tenantConfig.ai_modelo_ativo || 'claude-3-5-sonnet-20240620')
    }

    // 2. Fallback para Variáveis de Ambiente (Global)
    if (process.env.OPENAI_API_KEY) {
        const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
        return openai('gpt-4o')
    }

    const googleKey = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY
    if (googleKey) {
        const google = createGoogleGenerativeAI({ apiKey: googleKey })
        return google('gemini-1.5-flash')
    }

    if (process.env.ANTHROPIC_API_KEY) {
        const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
        return anthropic('claude-3-5-sonnet-20240620')
    }

    throw new Error("Nenhum provedor de IA configurado. Verifique as configurações ou as variáveis de ambiente.")
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
        const limpo = text.replace(/```json/g, '').replace(/```/g, '').trim()
        return JSON.parse(limpo)
    } catch {
        console.error("Failed to parse JSON from AI", text)
        throw new Error('A resposta da IA não foi um JSON válido.')
    }
}
