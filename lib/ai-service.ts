import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'

// Retorna o modelo configurado para o tenant atual
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

    const modeloAtivo = tenantConfig.ai_modelo_ativo || 'gemini-2.0-flash'

    // OpenAI — usa .chat() para Chat Completions (não Responses API)
    if (modeloAtivo.startsWith('gpt-')) {
        const key = tenantConfig.ai_key_openai || process.env.OPENAI_API_KEY
        if (key) {
            return createOpenAI({ apiKey: key }).chat(modeloAtivo)
        }
    }

    // Anthropic
    if (modeloAtivo.startsWith('claude-')) {
        const key = tenantConfig.ai_key_claude || process.env.ANTHROPIC_API_KEY
        if (key) {
            return createAnthropic({ apiKey: key })(modeloAtivo)
        }
    }

    // Google
    if (modeloAtivo.startsWith('gemini-')) {
        const key = tenantConfig.ai_key_google || process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY
        if (key) {
            return createGoogleGenerativeAI({ apiKey: key })(modeloAtivo)
        }
    }

    // Fallbacks
    if (tenantConfig.ai_key_google || process.env.GOOGLE_AI_API_KEY) {
        const key = tenantConfig.ai_key_google || process.env.GOOGLE_AI_API_KEY
        return createGoogleGenerativeAI({ apiKey: key! })('gemini-2.0-flash')
    }

    if (tenantConfig.ai_key_openai || process.env.OPENAI_API_KEY) {
        const key = tenantConfig.ai_key_openai || process.env.OPENAI_API_KEY
        return createOpenAI({ apiKey: key! }).chat('gpt-4o')
    }

    if (tenantConfig.ai_key_claude || process.env.ANTHROPIC_API_KEY) {
        const key = tenantConfig.ai_key_claude || process.env.ANTHROPIC_API_KEY
        return createAnthropic({ apiKey: key! })('claude-3-5-sonnet-20241022')
    }

    throw new Error('Nenhum provedor de IA configurado para o modelo: ' + modeloAtivo)
}

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

export function extractJSON(text: string) {
    try {
        const start = text.indexOf('{')
        const end = text.lastIndexOf('}')
        if (start === -1 || end === -1 || end < start) {
            throw new Error('JSON não encontrado na resposta da IA')
        }
        const jsonContent = text.slice(start, end + 1)
        return JSON.parse(jsonContent)
    } catch (e) {
        console.error('Falha ao extrair JSON:', text)
        throw e
    }
}
