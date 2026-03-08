import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Domínios raiz conhecidos (sem subdomínio = landing page da Nexori)
const APEX_DOMAINS = [
    'nexori.com.br',
    'nexori.com',
    'on-gs-brasileiras.vercel.app',
]

// Subdomínios reservados (não são portais de ONG)
const RESERVED_SUBDOMAINS = ['www', 'app', 'api', 'admin', 'mail']

// Rotas de portal público (sem subdomínio → landing)
const PORTAL_PATHS = ['/', '/cursos', '/atividades', '/inscricao', '/minha-area', '/validar']

// Retorna o slug do subdomínio da Nexori, ou null se for domínio raiz/reservado
function getSubdomain(host: string): string | null {
    const hostname = host.split(':')[0].toLowerCase()

    for (const apex of APEX_DOMAINS) {
        if (hostname === apex || hostname === `www.${apex}`) return null
        if (hostname.endsWith(`.${apex}`)) {
            const sub = hostname.slice(0, hostname.length - apex.length - 1)
            if (!RESERVED_SUBDOMAINS.includes(sub)) return sub
        }
    }

    // localhost → sem subdomínio (development)
    if (hostname === 'localhost') return null

    return null
}

// Verifica se o host é um domínio da Nexori (raiz ou subdomínio)
function isNexoriDomain(host: string): boolean {
    const hostname = host.split(':')[0].toLowerCase()
    return APEX_DOMAINS.some(apex => hostname === apex || hostname === `www.${apex}` || hostname.endsWith(`.${apex}`))
}

function isPortalPath(pathname: string): boolean {
    return PORTAL_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isAuthOrInternalPath(pathname: string): boolean {
    return (
        pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/conta-suspensa') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/projetos') ||
        pathname.startsWith('/planos-trabalho') ||
        pathname.startsWith('/patrimonio') ||
        pathname.startsWith('/configuracoes') ||
        pathname.startsWith('/prestacoes-contas') ||
        pathname.startsWith('/backoffice') ||
        pathname.startsWith('/logs-auditoria') ||
        pathname.startsWith('/landing')
    )
}

export async function middleware(request: NextRequest) {
    const host = request.headers.get('host') || ''
    const pathname = request.nextUrl.pathname

    // Ignorar assets estáticos
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/favicon') ||
        pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$/)
    ) {
        return NextResponse.next()
    }

    const hostname = host.split(':')[0].toLowerCase()
    const subdomain = getSubdomain(host)
    const isNexori = isNexoriDomain(host)

    if (subdomain) {
        // ─── Subdomínio da Nexori (ex: instituto-esperanca.nexori.com.br) ───
        // Injeta slug para getTenant() resolver o tenant correto
        const requestWithSlug = new NextRequest(request.url, {
            headers: new Headers({
                ...Object.fromEntries(request.headers.entries()),
                'x-tenant-slug': subdomain,
            }),
            method: request.method,
        })
        const response = await updateSession(requestWithSlug)
        response.headers.set('x-tenant-slug', subdomain)
        return response

    } else if (!isNexori && hostname !== 'localhost') {
        // ─── Domínio customizado da ONG (ex: portal.institutoabc.org.br) ───
        // getTenant() já resolve via dominio_custom, apenas passa o host original
        return await updateSession(request)

    } else {
        // ─── Domínio raiz da Nexori (nexori.com.br, localhost) ───
        // Rotas internas, auth e landing → deixa passar
        if (isAuthOrInternalPath(pathname) || pathname.startsWith('/api')) {
            return await updateSession(request)
        }

        // Rotas de portal sem subdomínio → redireciona para landing
        if (isPortalPath(pathname)) {
            const url = request.nextUrl.clone()
            url.pathname = '/landing'
            return NextResponse.redirect(url)
        }

        return await updateSession(request)
    }
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
