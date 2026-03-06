import { createClient } from '@/lib/supabase/server'
import { calcularValorDepreciado } from '@/lib/utils/depreciation'

export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 })
    }

    const supabase = createClient()

    // 1. Buscar bens ativos
    const { data: bens } = await supabase
        .from('patrimonio_bens')
        .select('id, tombamento, valor_aquisicao, depreciacao_anual, data_aquisicao, tenant_id')
        .eq('status', 'ativo')

    if (!bens || bens.length === 0) return Response.json({ message: 'No assets to update' })

    const updates = []
    const historico = []

    for (const bem of bens) {
        const noveValor = calcularValorDepreciado(
            bem.valor_aquisicao,
            bem.depreciacao_anual,
            bem.data_aquisicao
        )

        updates.push({
            id: bem.id,
            valor_atual: noveValor
        })

        historico.push({
            bem_id: bem.id,
            tenant_id: bem.tenant_id,
            valor: noveValor,
            data: new Date().toISOString()
        })
    }

    // 2. Transação de atualização (Upsert para atualizar os bens e Insert para o histórico)
    const { error: errorUpdate } = await supabase.from('patrimonio_bens').upsert(updates)
    if (errorUpdate) return new Response(errorUpdate.message, { status: 500 })

    const { error: errorHist } = await supabase.from('patrimonio_depreciacao_historico').insert(historico)
    if (errorHist) return new Response(errorHist.message, { status: 500 })

    return Response.json({ success: true, updated: bens.length })
}
