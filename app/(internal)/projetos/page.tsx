import { createClient } from '@/lib/supabase/server'
import { ProjetosTable } from './ProjetosTable'

export default async function ProjetosPage() {
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

    let query = supabase.from('projetos').select('*')

    if (tenantId) {
        query = query.eq('tenant_id', tenantId)
    }

    const { data: projetos, error } = await query.order('created_at', { ascending: false })

    if (error) {
        return (
            <div className="p-8 text-center bg-orange-50 text-orange-700 rounded-lg">
                <h2 className="font-bold text-lg mb-2">Erro ao carregar projetos</h2>
                <p className="text-sm">{error.message}</p>
            </div>
        )
    }

    return <ProjetosTable initialData={(projetos as any[]) || []} />
}
