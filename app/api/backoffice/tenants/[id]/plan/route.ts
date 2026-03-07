import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const tenantId = params.id
        const { plano } = await req.json()

        if (!plano) {
            return NextResponse.json({ error: 'Plano não informado' }, { status: 400 })
        }

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

        // 1. Verificar Autenticação e Role
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.user_metadata?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
        }

        // 2. Atualizar no Banco via Service Role
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await adminSupabase
            .from('tenants')
            .update({ plano })
            .eq('id', tenantId)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error updating plan:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
