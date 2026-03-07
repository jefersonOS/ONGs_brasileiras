import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const { status } = await req.json()

        if (!id || !status) {
            return NextResponse.json({ error: 'ID e status são obrigatórios' }, { status: 400 })
        }

        // 1. Verificar Autenticação e Role de Super Admin
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    }
                }
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.user_metadata?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
        }

        // 2. Usar Service Role para atualizar o tenant
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error: updateError } = await adminSupabase
            .from('tenants')
            .update({ status })
            .eq('id', id)

        if (updateError) throw updateError

        return NextResponse.json({ message: `Status do tenant atualizado para ${status}` })
    } catch (error: any) {
        console.error('Error toggling tenant status:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
