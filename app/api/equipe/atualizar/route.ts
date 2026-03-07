import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { userId, role, permissoes } = await req.json()

        if (!userId || !role || !permissoes) {
            return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
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

        // 1. Verificar se quem está editando é superadmin ou proprietário
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

        const currentUserRole = currentUser.user_metadata?.role
        const tenantId = currentUser.user_metadata?.tenant_id

        if (currentUserRole !== 'proprietario' && currentUserRole !== 'superadmin') {
            return NextResponse.json({ error: 'Apenas proprietários podem editar a equipe' }, { status: 403 })
        }

        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 2. Verificar se o usuário sendo editado pertence ao mesmo tenant
        const { data: targetUser, error: fetchError } = await adminSupabase
            .from('users')
            .select('tenant_id')
            .eq('id', userId)
            .single()

        if (fetchError || !targetUser) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
        }

        if (currentUserRole !== 'superadmin' && targetUser.tenant_id !== tenantId) {
            return NextResponse.json({ error: 'Você não tem permissão para editar este usuário' }, { status: 403 })
        }

        // 3. Atualizar public.users
        const { error: updatePublicError } = await adminSupabase
            .from('users')
            .update({ role, permissoes })
            .eq('id', userId)

        if (updatePublicError) throw updatePublicError

        // 4. Atualizar auth.users metadata
        const { error: updateAuthError } = await adminSupabase.auth.admin.updateUserById(
            userId,
            {
                user_metadata: {
                    role,
                    permissoes,
                    // Mantemos o resto mas garantimos esses dois
                }
            }
        )

        if (updateAuthError) throw updateAuthError

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error updating member:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
