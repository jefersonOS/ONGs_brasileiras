import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const url = request.nextUrl.clone()
    const isInternalRoute = request.nextUrl.pathname.startsWith('/dashboard') ||
        request.nextUrl.pathname.startsWith('/projetos') ||
        request.nextUrl.pathname.startsWith('/planos-trabalho') ||
        request.nextUrl.pathname.startsWith('/atividades') ||
        request.nextUrl.pathname.startsWith('/cursos') ||
        request.nextUrl.pathname.startsWith('/patrimonio')

    if (!user && isInternalRoute) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Handle citizens trying to access internal paths
    if (user && user.user_metadata?.tipo === 'cidadao' && isInternalRoute) {
        url.pathname = '/minha-area'
        return NextResponse.redirect(url)
    }

    // Role-based access control (RBAC) for Global Backoffice
    const isAdminRoute = request.nextUrl.pathname.startsWith('/backoffice') ||
        request.nextUrl.pathname.startsWith('/logs-auditoria')

    if (user && isAdminRoute && user.user_metadata?.role !== 'superadmin') {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // 4. Check Tenant/User Status (Access Control)
    if (user && isInternalRoute && user.user_metadata?.role !== 'superadmin') {
        const tenantId = user.user_metadata?.tenant_id

        if (tenantId) {
            // We fetch the tenant status. 
            // NOTE: In a high-traffic app, this should be cached or in JWT.
            const { data: tenant } = await supabase
                .from('tenants')
                .select('status')
                .eq('id', tenantId)
                .single()

            if (tenant && tenant.status !== 'ativo') {
                url.pathname = '/conta-suspensa'
                return NextResponse.redirect(url)
            }
        }

        // Also check if user is active
        const { data: userData } = await supabase
            .from('users')
            .select('ativo')
            .eq('id', user.id)
            .single()

        if (userData && !userData.ativo) {
            url.pathname = '/login'
            // Sign out or clear session could be handled here if needed
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
