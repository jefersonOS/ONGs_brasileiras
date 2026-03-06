import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function getTenant() {
    const supabase = createClient()
    const host = headers().get('x-forwarded-host') || headers().get('host') || ''

    // 1. Busca pelo domínio customizado
    const { data: tenantByDomain } = await supabase
        .from('tenants')
        .select('*')
        .eq('dominio_custom', host)
        .single()

    if (tenantByDomain) return tenantByDomain

    // 2. Fallback: Busca pelo primeiro tenant (para desenvolvimento local)
    // Em produção, isso seria substituído por uma lógica que identifica o subdomínio
    const { data: firstTenant } = await supabase
        .from('tenants')
        .select('*')
        .limit(1)
        .single()

    return firstTenant
}
