import { createClient } from '@/lib/supabase/server'
import { PlanosTable } from './PlanosTable'

export default async function PlanosTrabalhoPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-lg">
                Sessão expirada. Por favor, faça login novamente.
            </div>
        )
    }

    const tenantId = user.user_metadata?.tenant_id

    // In Next.js App Router we fetch data server-side
    let query = supabase.from('planos_trabalho').select(`
      *,
      projetos ( nome )
    `)

    if (tenantId) {
        query = query.eq('tenant_id', tenantId)
    }

    const { data: planos, error } = await query.order('created_at', { ascending: false })

    if (error) {
        return (
            <div className="p-8 text-center bg-orange-50 text-orange-700 rounded-lg">
                <h2 className="font-bold text-lg mb-2">Erro ao carregar planos de trabalho</h2>
                <p className="text-sm">{error.message}</p>
            </div>
        )
    }

    const userRole = user.user_metadata?.role

    return <PlanosTable initialData={(planos as any[]) || []} userRole={userRole} />
}
