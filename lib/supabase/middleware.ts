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
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

    const isPublicPortalRoute = request.nextUrl.pathname.startsWith('/minha-area') ||
        request.nextUrl.pathname === '/' ||
        request.nextUrl.pathname.startsWith('/validar')

    if (!user && isInternalRoute) {
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Handle citizens trying to access internal paths
    if (user && user.user_metadata?.tipo === 'cidadao' && isInternalRoute) {
        url.pathname = '/minha-area'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
