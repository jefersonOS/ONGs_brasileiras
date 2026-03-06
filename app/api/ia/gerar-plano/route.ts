import { NextResponse } from 'next/server'
import { gerarPlanoTrabalho } from '@/lib/ai-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { ideiaCentral } = await req.json()

        if (!ideiaCentral) {
            return NextResponse.json({ error: 'A ideia central é obrigatória.' }, { status: 400 })
        }

        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
        }

        const tenantId = user.user_metadata?.tenant_id || 'test-tenant' // Fallback for dev without strictly isolated tenant

        const planoGerado = await gerarPlanoTrabalho(ideiaCentral, tenantId)

        return NextResponse.json(planoGerado)
    } catch (error: any) {
        console.error("Error on gerar-plano", error)
        return NextResponse.json({ error: error.message || 'Erro ao gerar o plano de trabalho' }, { status: 500 })
    }
}
