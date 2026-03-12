import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { prestacaoId, status, parecer } = await req.json()
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return new Response('Unauthorized', { status: 401 })

        // 1. Atualizar Status da Prestação
        const { error: pError } = await supabase
            .from('prestacoes_contas')
            .update({ status })
            .eq('id', prestacaoId)

        if (pError) throw pError

        // 2. Registrar Parecer se existir (armazenado no campo observacao)
        if (parecer) {
            const { error: fError } = await supabase
                .from('prestacoes_contas')
                .update({ parecer })
                .eq('id', prestacaoId)

            if (fError) throw fError
        }

        return Response.json({ success: true })

    } catch (error: any) {
        console.error('Review Error:', error)
        return new Response(error.message, { status: 500 })
    }
}
