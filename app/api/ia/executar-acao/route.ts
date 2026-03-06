import { createClient } from '@/lib/supabase/server'
import { logAIAudit } from '@/lib/ai-service'

export async function POST(req: Request) {
    const { tipo, dados, titulo } = await req.json()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new Response('Unauthorized', { status: 401 })
    }

    const tenantId = user.user_metadata?.tenant_id

    try {
        let result = null

        if (tipo === 'criar_plano') {
            const { data, error } = await supabase.from('planos_trabalho').insert({
                tenant_id: tenantId,
                criador_id: user.id,
                titulo: dados.titulo || titulo,
                descricao: dados.descricao,
                objetivos: dados.objetivos,
                status: 'rascunho',
                gerado_por_ia: true
            }).select('id').single()

            if (error) throw error
            result = data

            await logAIAudit(supabase, {
                tenantId,
                entidade: 'planos_trabalho',
                acao: 'CREATE',
                dadosDepois: { id: data.id, titulo: dados.titulo || titulo },
                modelo: 'Nexori AI'
            })
        }

        else if (tipo === 'criar_atividade') {
            const { data, error } = await supabase.from('atividades').insert({
                tenant_id: tenantId,
                titulo: dados.titulo || titulo,
                tipo: dados.tipo || 'evento',
                vagas: dados.vagas || 0,
                status: 'rascunho',
                visibilidade: 'privada'
            }).select('id').single()

            if (error) throw error
            result = data

            await logAIAudit(supabase, {
                tenantId,
                entidade: 'atividades',
                acao: 'CREATE',
                dadosDepois: { id: data.id, titulo: dados.titulo || titulo },
                modelo: 'Nexori AI'
            })
        }

        // Marcar alerta como resolvido se existir
        if (dados.alerta_id) {
            await supabase.from('ia_acoes_pendentes')
                .update({ status: 'concluido' })
                .eq('id', dados.alerta_id)
        }

        return Response.json({ success: true, id: result?.id })
    } catch (error: any) {
        console.error('Erro ao executar ação da IA:', error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
