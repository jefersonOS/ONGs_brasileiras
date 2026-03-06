import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { tombamento, descricao, tipo = 'ocorrencia' } = await req.json()
        const supabase = createClient()

        if (!tombamento || !descricao) return new Response('Missing data', { status: 400 })

        // 1. Buscar o ID do bem e tenantId
        const { data: bem } = await supabase
            .from('patrimonio_bens')
            .select('id, tenant_id')
            .eq('tombamento', tombamento)
            .single()

        if (!bem) return new Response('Asset not found', { status: 404 })

        // 2. Registrar ocorrência
        const { error } = await supabase
            .from('patrimonio_ocorrencias')
            .insert({
                tenant_id: bem.tenant_id,
                bem_id: bem.id,
                descricao,
                tipo,
                status: 'pendente'
            })

        if (error) throw error

        return Response.json({ success: true })

    } catch (error: any) {
        console.error('Occurrence Error:', error)
        return new Response(error.message, { status: 500 })
    }
}
