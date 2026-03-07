import { createClient } from '@/lib/supabase/server'
import { PatrimonioTable } from './PatrimonioTable'

export default async function PatrimonioPage() {
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

    let query = supabase.from('patrimonio_bens').select('*')

    if (tenantId) {
        query = query.eq('tenant_id', tenantId)
    }

    const { data: bens, error } = await query.order('created_at', { ascending: false })

    if (error) {
        return (
            <div className="p-8 text-center bg-orange-50 text-orange-700 rounded-lg">
                <h2 className="font-bold text-lg mb-2">Erro ao carregar bens do patrimônio</h2>
                <p className="text-sm">{error.message}</p>
            </div>
        )
    }

    return <PatrimonioTable initialData={(bens as any[]) || []} />
}
