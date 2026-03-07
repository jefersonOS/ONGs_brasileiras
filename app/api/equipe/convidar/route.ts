import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
    try {
        const { email, permissoes } = await req.json()

        // 1. Verificar Autenticação
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
        if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

        const userRole = user.user_metadata?.role
        const tenantId = user.user_metadata?.tenant_id

        if (userRole !== 'proprietario' && userRole !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas proprietários podem convidar equipe' }, { status: 403 })
        }

        // 2. Criar Convite
        const token = uuidv4()
        const expiraEm = new Date()
        expiraEm.setDate(expiraEm.getDate() + 7) // 7 dias de validade

        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error: conviteError } = await adminSupabase
            .from('convites_equipe')
            .insert({
                tenant_id: tenantId,
                token,
                email,
                permissoes,
                status: 'pendente',
                expira_em: expiraEm.toISOString(),
                criado_por: user.id
            })
            .select()
            .single()

        if (conviteError) throw conviteError

        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        const inviteLink = `${origin}/convite/${token}`

        return NextResponse.json({ inviteLink, token })
    } catch (error: any) {
        console.error('Error generating invite:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
