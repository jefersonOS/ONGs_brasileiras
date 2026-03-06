import { streamText, tool } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getAIProvider, logAIAudit } from '@/lib/ai-service'

export const maxDuration = 30 // Allow up to 30 seconds for the AI stream

export async function POST(req: Request) {
    const { messages } = await req.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new Response('Unauthorized', { status: 401 })
    }

    // Identificar ou criar uma Conversa (Simplificado para MVP: agrupar por usuario/tenant no dia)
    let conversaId = null
    const { data: ultimaConversa } = await supabase
        .from('ia_conversas')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (ultimaConversa) {
        conversaId = ultimaConversa.id
    } else {
        const { data: nova } = await supabase
            .from('ia_conversas')
            .insert({ tenant_id: user.user_metadata?.tenant_id, user_id: user.id, titulo: 'Sessão de Assistência' })
            .select('id').single()
        if (nova) conversaId = nova.id
    }

    // Gravar a mensagem recebida (Última message user)
    const ultimaMsg = messages[messages.length - 1]
    if (conversaId && ultimaMsg.role === 'user') {
        await supabase.from('ia_mensagens').insert({
            conversa_id: conversaId,
            role: 'user',
            content: ultimaMsg.content
        })
    }

    // Provedor dinâmico
    const model = await getAIProvider(user.user_metadata?.tenant_id)

    // Configurando o agente com tools dinâmicas para a ONG
    const result = streamText({
        model,
        system: `Você é a Nexori AI, uma assistente virtual focada em ONGs. Siga diretrizes de gestão de ONGs, seja formal e objetiva. Você pode criar rascunhos de planos de trabalho ou responder dúvidas sobre processos organizacionais.`,
        messages,
        tools: {
            gerarPlanoTrabalho: tool({
                description: 'Gera e salva um rascunho de um plano de trabalho para a ONG baseando-se numa descrição ou ideia de projeto fornecida pelo usuário.',
                parameters: z.object({
                    titulo: z.string().describe('O título chamativo e oficial para o plano de trabalho'),
                    descricao: z.string().describe('Resumo do que se trata o plano de trabalho'),
                    objetivos: z.string().describe('Tópicos ou listagem dos objetivos do projeto'),
                }),
                execute: async ({ titulo, descricao, objetivos }: { titulo: string, descricao: string, objetivos: string }) => {
                    const tenantId = user.user_metadata?.tenant_id
                    const { data, error } = await supabase.from('planos_trabalho').insert({
                        tenant_id: tenantId,
                        criador_id: user.id,
                        titulo,
                        descricao,
                        objetivos,
                        status: 'rascunho',
                        gerado_por_ia: true
                    }).select('id').single()

                    if (error) {
                        return { error: 'Ocorreu um erro ao salvar o rascunho: ' + error.message }
                    }

                    // Registrar Auditoria
                    await logAIAudit(supabase, {
                        tenantId,
                        entidade: 'planos_trabalho',
                        acao: 'CREATE',
                        dadosDepois: { id: data.id, titulo }
                    })

                    return { message: 'Rascunho criado com sucesso! O usuário pode revisá-lo na aba Planos de Trabalho.', id: data.id }
                }
            })
        },
        async onFinish({ text, toolCalls }) {
            // Gravar a resposta da IA e Ações Tomadas no banco
            if (conversaId) {
                await supabase.from('ia_mensagens').insert({
                    conversa_id: conversaId,
                    role: 'assistant',
                    content: text,
                    modelo_usado: (model as any).modelId || 'desconhecido',
                    acoes_executadas: toolCalls || []
                })
            }
        }
    })

    return result.toTextStreamResponse()
}
