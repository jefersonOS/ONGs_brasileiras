import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { planoId, status, parecer } = body

        if (!planoId || !status) {
            return NextResponse.json({ error: 'Dados insuficientes' }, { status: 400 })
        }

        // 1. Verificar permissões (Apenas Super Admin)
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

        const role = user.user_metadata?.role
        const permissoes = user.user_metadata?.permissoes || {}

        // Autorizados: Super Admin, Proprietário ou Colaborador com permissão específica
        const isAuthorized =
            role === 'superadmin' ||
            role === 'proprietario' ||
            permissoes.aprovar_planos === true

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Você não tem permissão para aprovar planos' }, { status: 403 })
        }

        // 2. Usar Service Role para garantir a atualização (Independente de RLS de Tenant)
        const adminSupabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 3. Atualizar Status do Plano
        const { error: updateError } = await adminSupabase
            .from('planos_trabalho')
            .update({
                status,
                revisado_em: new Date().toISOString(),
                revisado_por: user.id
            })
            .eq('id', planoId)

        if (updateError) throw updateError

        // 4. Registrar Parecer (Se houver)
        if (parecer) {
            // Assumindo que temos uma tabela de pareceres ou um campo de histórico
            // Para simplicidade inicial, vamos registrar na tabela de logs ou campo específico
            // Se houver uma tabela 'planos_pareceres' futuramente, inserimos nela.
            // Por enquanto, atualizamos o campo 'parecer_tecnico' no próprio plano se existir
            await adminSupabase
                .from('planos_trabalho')
                .update({ parecer_tecnico: parecer })
                .eq('id', planoId)
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Erro na revisão:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
