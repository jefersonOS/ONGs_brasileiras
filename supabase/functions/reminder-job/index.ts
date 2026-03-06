import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Buscar eventos que começam amanhã (T+24h)
        const amanhã = new Date()
        amanhã.setDate(amanhã.getDate() + 1)
        const dataIso = amanhã.toISOString().split('T')[0]

        // Buscar em atividades e cursos
        const { data: inscricoes } = await supabase
            .from('inscricoes')
            .select(`
        id,
        tenant_id,
        turma_id,
        atividade_id,
        users (id, nome, telefone),
        turmas (encontros),
        atividades (titulo, data, horario, local)
      `)
            .eq('status', 'confirmada')

        const lembretesEnviados = 0

        // Simplificação: Filtramos na memória para este exemplo
        for (const insc of (inscricoes || [])) {
            let dadosEvento = null

            if (insc.atividades && insc.atividades.data === dataIso) {
                dadosEvento = {
                    nome: insc.users.nome,
                    evento: insc.atividades.titulo,
                    data: insc.atividades.data,
                    horario: insc.atividades.horario,
                    local: insc.atividades.local
                }
            } else if (insc.turmas) {
                const primeiroEncontro = insc.turmas.encontros?.[0]
                if (primeiroEncontro?.data === dataIso) {
                    dadosEvento = {
                        nome: insc.users.nome,
                        evento: 'Início do Curso',
                        data: primeiroEncontro.data,
                        horario: primeiroEncontro.hora_inicio,
                        local: primeiroEncontro.local
                    }
                }
            }

            if (dadosEvento && insc.users.telefone) {
                // Chamar serviço de WhatsApp (Replicando lógica para Edge Function)
                // Nota: Em produção, isso chamaria uma API ou o próprio WhatsAppService se fosse um módulo compartilhado
                console.log(`Enviando lembrete para ${insc.users.telefone}: ${dadosEvento.evento}`)
                // Lógica de envio aqui...
            }
        }

        return new Response(JSON.stringify({ success: true, processed: inscricoes?.length }), {
            headers: { 'Content-Type': 'application/json' },
        })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
