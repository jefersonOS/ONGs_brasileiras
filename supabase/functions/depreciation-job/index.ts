import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Buscar todos os bens ativos
        const { data: bens } = await supabase
            .from('patrimonio')
            .select('*')
            .not('valor_aquisicao', 'is', null)

        const hoje = new Date()

        for (const bem of (bens || [])) {
            const dataAquisicao = new Date(bem.data_aquisicao)
            const anos = (hoje.getTime() - dataAquisicao.getTime()) / (1000 * 60 * 60 * 24 * 365)

            if (anos > 0) {
                // Fórmula: Valor Atual = Valor Aquisição * (1 - taxa/100)^anos
                const taxa = bem.depreciacao_anual || 10
                const valorAtual = bem.valor_aquisicao * Math.pow(1 - taxa / 100, anos)

                await supabase
                    .from('patrimonio')
                    .update({ valor_atual: Math.max(0, valorAtual) })
                    .eq('id', bem.id)

                // Registrar histórico (opcional)
                await supabase.from('patrimonio_depreciacao').insert({
                    patrimonio_id: bem.id,
                    valor_anterior: bem.valor_atual,
                    valor_novo: valorAtual,
                    metodo: 'linear_automatico'
                })
            }
        }

        return new Response(JSON.stringify({ success: true, processed: bens?.length }), {
            headers: { 'Content-Type': 'application/json' },
        })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 })
    }
})
