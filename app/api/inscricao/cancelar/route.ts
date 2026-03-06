import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { inscricaoId } = await req.json()
        const supabase = createClient()

        // 1. Verificar se a inscrição pertence ao usuário logado
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return Response.json({ success: false, error: 'Não autorizado' }, { status: 401 })

        const { data: inscricao } = await supabase
            .from('inscricoes')
            .select('id, cidadao_id')
            .eq('id', inscricaoId)
            .single()

        if (!inscricao || inscricao.cidadao_id !== user.id) {
            return Response.json({ success: false, error: 'Inscrição não encontrada ou não pertence a você' }, { status: 404 })
        }

        // 2. Cancelar (Deletar ou Alterar Status)
        // Optamos por deletar para liberar a vaga imediatamente ou mudar para cancelada
        const { error } = await supabase
            .from('inscricoes')
            .update({ status: 'cancelada' })
            .eq('id', inscricaoId)

        if (error) throw error

        return Response.json({ success: true })

    } catch (error: any) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
