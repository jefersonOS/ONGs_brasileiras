import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { bemId, tipo, de, para, motivo, dataPrevistaDevolucao, tenantId } = await req.json()
        const supabase = createClient()

        if (!bemId || !tipo || !para) return new Response('Missing data', { status: 400 })

        // 1. Registrar movimentação
        const { error: moveError } = await supabase
            .from('patrimonio_movimentacoes')
            .insert({
                tenant_id: tenantId,
                bem_id: bemId,
                tipo,
                origem: de,
                destino: para,
                motivo,
                data_movimentacao: new Date().toISOString(),
                data_previsao_devolucao: dataPrevistaDevolucao || null
            })

        if (moveError) throw moveError

        // 2. Atualizar localização atual no bem
        const { error: updateError } = await supabase
            .from('patrimonio_bens')
            .update({ localizacao: para })
            .eq('id', bemId)

        if (updateError) throw updateError

        return Response.json({ success: true })

    } catch (error: any) {
        console.error('Movement Error:', error)
        return new Response(error.message, { status: 500 })
    }
}
