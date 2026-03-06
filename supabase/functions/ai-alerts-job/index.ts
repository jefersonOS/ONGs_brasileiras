import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Buscar Tenants para processar individualmente
        const { data: tenants } = await supabase.from('tenants').select('id, config_portal')

        for (const tenant of (tenants || [])) {
            // a. Planos vencendo em 7 dias
            const dataLimitePlano = new Date()
            dataLimitePlano.setDate(dataLimitePlano.getDate() + 7)

            const { data: planosVencendo } = await supabase
                .from('planos_trabalho')
                .select('*')
                .eq('tenant_id', tenant.id)
                .lt('data_fim', dataLimitePlano.toISOString())
                .neq('status', 'concluido')

            // b. Planos sem prestação há 15 dias
            const dataLimitePrestacao = new Date()
            dataLimitePrestacao.setDate(dataLimitePrestacao.getDate() - 15)

            const { data: planosSemPrestacao } = await supabase
                .from('planos_trabalho')
                .select('*, prestacoes_contas(*)')
                .eq('tenant_id', tenant.id)
                .eq('status', 'aprovado')

            const filtrados = planosSemPrestacao?.filter(p => !p.prestacoes_contas || p.prestacoes_contas.length === 0)

            // c. IA gera alertas (Mock da chamada de LLM para simplificar o script do Edge Function)
            for (const p of (planosVencendo || [])) {
                await supabase.from('ia_acoes_pendentes').insert({
                    tenant_id: tenant.id,
                    tipo: 'alerta_prazo',
                    descricao: `O plano "${p.titulo}" vence em menos de 7 dias. Organize a prestação final.`,
                    payload: { plano_id: p.id },
                    status: 'pendente'
                })
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
        })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
