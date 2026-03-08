import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function getTenant() {
    const supabase = createClient()
    const headersList = headers()

    // 1. Prioridade: slug injetado pelo middleware via subdomínio
    const slug = headersList.get('x-tenant-slug')
    if (slug) {
        const { data: tenantBySlug } = await supabase
            .from('tenants')
            .select('*')
            .eq('slug', slug)
            .single()

        if (tenantBySlug) return tenantBySlug
    }

    // 2. Domínio customizado (ex: portal.institutoabc.org.br)
    const host = headersList.get('x-forwarded-host') || headersList.get('host') || ''
    const hostname = host.split(':')[0]
    if (hostname) {
        const { data: tenantByDomain } = await supabase
            .from('tenants')
            .select('*')
            .eq('dominio_custom', hostname)
            .single()

        if (tenantByDomain) return tenantByDomain
    }

    // 3. Fallback: primeiro tenant ativo (desenvolvimento local)
    const { data: firstTenant } = await supabase
        .from('tenants')
        .select('*')
        .eq('status', 'active')
        .limit(1)
        .single()

    return firstTenant
}
