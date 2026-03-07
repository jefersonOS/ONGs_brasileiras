import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

export async function POST(req: Request) {
    try {
        const { planoId, tenantId } = await req.json()
        const supabase = createClient()

        // 1. Buscar Configurações do Tenant para chaves e modelo
        const { data: tenant } = await supabase
            .from('tenants')
            .select('config_portal')
            .eq('id', tenantId)
            .single()

        const cfg = tenant?.config_portal || {}

        // 2. Buscar Plano de Trabalho para contexto
        const { data: plano } = await supabase
            .from('planos_trabalho')
            .select('*')
            .eq('id', planoId)
            .single()

        if (!plano) throw new Error('Plano não encontrado')

        // 3. Preparar Provider de IA (sempre via factory para evitar Responses API)
        let modelProvider: any
        const modeloAtivo = cfg.ai_modelo_ativo || 'claude-3-5-sonnet-20240620'

        if (modeloAtivo.startsWith('gpt-') && cfg.ai_key_openai) {
            modelProvider = createOpenAI({ apiKey: cfg.ai_key_openai }).chat(modeloAtivo)
        } else if (modeloAtivo.startsWith('gemini-') && cfg.ai_key_google) {
            modelProvider = createGoogleGenerativeAI({ apiKey: cfg.ai_key_google })(modeloAtivo)
        } else {
            const key = cfg.ai_key_claude || process.env.ANTHROPIC_API_KEY
            modelProvider = createAnthropic({ apiKey: key })('claude-3-5-sonnet-20240620')
        }

        // 4. Prompt para a IA
        const prompt = `
            Você é um assistente financeiro especializado em ONGs brasileiras.
            Com base no Plano de Trabalho abaixo, sugira itens de Receita e Despesa para uma Prestação de Contas Mensal.

            PLANO: ${plano.titulo}
            DESCRIÇÃO: ${plano.objetivo}
            ORÇAMENTO TOTAL: R$ ${plano.orcamento_total}

            Retorne APENAS um JSON no seguinte formato:
            {
                "titulo": "Prestação de Contas - [Mês/Ano]",
                "receitas": [
                    { "categoria": "Repasse Público", "descricao": "Parcela mensal do convênio", "valor": 5000.00 }
                ],
                "despesas": [
                    { "categoria": "Recursos Humanos", "descricao": "Pagamento de instrutores", "valor": 3500.00 },
                    { "categoria": "Materiais", "descricao": "Papelaria e insumos", "valor": 500.00 }
                ]
            }

            Distribua os valores de forma proporcional a um mês típico (divida o total por 10 ou 12 meses).
        `

        const { text } = await generateText({
            model: modelProvider,
            prompt,
        })

        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null

        return Response.json(result)

    } catch (error: any) {
        console.error('AI Generation Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
}
