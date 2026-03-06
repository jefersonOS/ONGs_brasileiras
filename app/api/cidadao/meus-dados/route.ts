import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const data = await req.json()
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return Response.json({ success: false, error: 'Não autorizado' }, { status: 401 })

        const { error } = await supabase.auth.updateUser({
            data: {
                nome: data.nome,
                whatsapp: data.whatsapp
            },
            password: data.password || undefined
        })

        if (error) throw error

        // Atualizar também a tabela users
        const { error: dbError } = await supabase
            .from('users')
            .update({
                nome: data.nome,
                whatsapp: data.whatsapp
            })
            .eq('id', user.id)

        if (dbError) throw dbError

        return Response.json({ success: true })

    } catch (error: any) {
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
