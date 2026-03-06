import { streamText, tool } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { getAIProvider, logAIAudit } from '@/lib/ai-service'

export const maxDuration = 30

export async function POST(req: Request) {
    const { messages, paginaAtual } = await req.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new Response('Unauthorized', { status: 401 })
    }

    const tenantId = user.user_metadata?.tenant_id

    // 1. Buscar Contexto do Supabase
    const [
        { data: projetos },
        { data: planosProximos },
        { data: prestacoesSemPlano },
        { data: alertasPendentes },
        { data: tenantInfo }
    ] = await Promise.all([
        supabase.from('projetos').select('id, titulo, status').eq('tenant_id', tenantId).eq('status', 'ativo'),
        supabase.from('planos_trabalho')
            .select('id, titulo, data_limite')
            .eq('tenant_id', tenantId)
            .neq('status', 'aprovado')
            .lte('data_limite', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('prestacoes_contas').select('id, descricao, valor_total').eq('tenant_id', tenantId).is('plano_trabalho_id', null),
        supabase.from('ia_acoes_pendentes').select('*').eq('tenant_id', tenantId).eq('status', 'pendente'),
        supabase.from('tenants').select('name').eq('id', tenantId).single()
    ])

    const contexto = {
        projetos_ativos: projetos || [],
        prazos_vencendo_7dias: planosProximos || [],
        prestacoes_sem_vinculo: prestacoesSemPlano || [],
        alertas_ia: alertasPendentes || [],
        ong_nome: tenantInfo?.name || 'ONG'
    }

    // Identificar ou criar uma Conversa (Simplificado para MVP)
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
            .insert({ tenant_id: tenantId, user_id: user.id, titulo: 'Assistência Contextual' })
            .select('id').single()
        if (nova) conversaId = nova.id
    }

    // Gravar a mensagem recebida
    const ultimaMsg = messages[messages.length - 1]
    if (conversaId && ultimaMsg.role === 'user') {
        await supabase.from('ia_mensagens').insert({
            conversa_id: conversaId,
            role: 'user',
            content: ultimaMsg.content
        })
    }

    // Provedor dinâmico
    const model = await getAIProvider(tenantId)

    const result = streamText({
        model: model as any,
        system: `Você é a IA gestora da plataforma ${contexto.ong_nome}. Conhece todos os dados da organização.
DADOS ATUAIS (Subabase): ${JSON.stringify(contexto)}
PÁGINA ATUAL: ${paginaAtual || 'Dashboard'}

REGRAS:
1. Responda em português brasileiro. Seja objetivo e profissional.
2. Sempre que for sugerir uma ação que possa ser automatizada (como criar um novo plano, aprovar uma prestação ou agendar atividade), você DEVE retornar um bloco JSON no final da sua resposta no formato exato:
{
  "acao": true,
  "tipo": "criar_plano" | "vincular_prestacao" | "criar_atividade",
  "titulo": "Título sugerido para a ação",
  "dados": { ... campos necessários para a ação ... }
}
Exemplo de dados para criar_plano: { titulo, descricao, objetivos }.
Exemplo de dados para criar_atividade: { titulo, tipo, vagas, data }.

Mantenha o tom de um consultoria especializada em MROSC.`,
        messages,
        async onFinish({ text, toolCalls }) {
            if (conversaId) {
                await supabase.from('ia_mensagens').insert({
                    conversa_id: conversaId,
                    role: 'assistant',
                    content: text,
                    modelo_usado: (model as any).modelId || 'desconhecido'
                })
            }
        }
    })

    return result.toTextStreamResponse()
}
