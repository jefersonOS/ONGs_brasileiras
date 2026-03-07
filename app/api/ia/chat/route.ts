import { streamText, convertToModelMessages } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { getAIProvider } from '@/lib/ai-service'

export const maxDuration = 30

export async function POST(req: Request) {
    const { messages, paginaAtual } = await req.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new Response('Unauthorized', { status: 401 })
    }

    const { data: dbUser } = await supabase
        .from('users')
        .select('*, tenant:tenants(*)')
        .eq('id', user.id)
        .single()

    const isCidadao = dbUser?.role === 'cidadao'
    const tenantId = dbUser?.tenant_id

    let contexto: any = {}

    if (isCidadao) {
        const [
            { data: cursos },
            { data: atividades },
            { data: minhasInscricoes }
        ] = await Promise.all([
            supabase.from('cursos').select('*').eq('tenant_id', tenantId).eq('visibilidade', 'publico').eq('status', 'ativo'),
            supabase.from('atividades').select('*').eq('tenant_id', tenantId).eq('visibilidade', 'publico').in('status', ['publicada', 'em_andamento']),
            supabase.from('inscricoes').select('*, turmas(*, curso:cursos(*)), atividades(*)').eq('cidadao_id', user.id)
        ])

        contexto = {
            cursos_disponiveis: cursos || [],
            atividades_agendadas: atividades || [],
            minhas_inscricoes: minhasInscricoes || [],
            ong_nome: dbUser?.tenant?.nome || 'ONG'
        }
    } else {
        const [
            { data: projetos },
            { data: planosProximos },
            { data: alertasPendentes }
        ] = await Promise.all([
            supabase.from('projetos').select('id, titulo, status').eq('tenant_id', tenantId).eq('status', 'ativo'),
            supabase.from('planos_trabalho').select('id, titulo, data_limite').eq('tenant_id', tenantId).neq('status', 'aprovado'),
            supabase.from('ia_acoes_pendentes').select('*').eq('tenant_id', tenantId).eq('status', 'pendente')
        ])

        contexto = {
            projetos_ativos: projetos || [],
            prazos_vencendo: planosProximos || [],
            alertas_ia: alertasPendentes || [],
            ong_nome: dbUser?.tenant?.nome || 'ONG'
        }
    }

    const systemPrompt = isCidadao
        ? `Você é o assistente virtual da ${contexto.ong_nome}. Sua missão é ajudar CIDADÃOS.
           DADOS DO CIDADÃO: ${JSON.stringify(contexto)}
           REGRAS:
           1. Responda de forma acolhedora, simples e prestativa.
           2. Ajude a encontrar cursos e atividades abertas.
           3. Informe o status das inscrições do cidadão.
           4. Se ele perguntar sobre algo que não está nos dados, direcione para o contato da ONG.`
        : `Você é a IA gestora da plataforma ${contexto.ong_nome}. Conhece todos os dados da organização.
           DADOS ATUAIS (Supabase): ${JSON.stringify(contexto)}
           PÁGINA ATUAL: ${paginaAtual || 'Dashboard'}
           REGRAS:
           1. Responda em português brasileiro. Seja objetivo e profissional.
           2. Sempre que for sugerir uma ação automatizada (criar plano, etc.), use o JSON formatado.
           Mantenha o tom de consultoria especializada em MROSC.`

    const model = await getAIProvider()
    const modelMessages = await convertToModelMessages(messages)

    const result = streamText({
        model,
        system: systemPrompt,
        messages: modelMessages,
        async onFinish({ text }) {
            try {
                await supabase.from('ia_mensagens').insert({
                    role: 'assistant',
                    content: text,
                    user_id: user.id,
                    tenant_id: tenantId
                })
            } catch (e) {
                console.error('Error logging IA message:', e)
            }
        }
    })

    return result.toUIMessageStreamResponse()
}
