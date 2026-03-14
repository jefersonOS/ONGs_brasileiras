import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id: atividadeId } = params
        const { nome, cpf } = await req.json()

        if (!nome?.trim()) {
            return Response.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }

        const supabase = createClient()
        const adminSupabase = createAdminClient()

        // Obter dados do usuário logado para tenant_id
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return Response.json({ error: 'Não autorizado' }, { status: 401 })
        const tenantId = authUser.user_metadata?.tenant_id
        if (!tenantId) return Response.json({ error: 'Tenant não encontrado' }, { status: 400 })

        let userId: string

        // 1. Tentar encontrar usuário pelo CPF (se fornecido)
        if (cpf?.trim()) {
            const cpfLimpo = cpf.replace(/\D/g, '')
            const { data: existingUser } = await adminSupabase
                .from('users')
                .select('id')
                .eq('cpf', cpfLimpo)
                .eq('tenant_id', tenantId)
                .maybeSingle()

            if (existingUser) {
                userId = existingUser.id
            } else {
                // Criar novo usuário com email gerado a partir do CPF
                const email = `walkin.${cpfLimpo}@nexori.walkin`
                const { data: newUser, error: userError } = await adminSupabase
                    .from('users')
                    .insert({
                        tenant_id: tenantId,
                        nome: nome.trim(),
                        cpf: cpfLimpo,
                        email,
                        role: 'cidadao',
                        tipo: 'cidadao',
                    })
                    .select('id')
                    .single()

                if (userError) throw userError
                userId = newUser.id
            }
        } else {
            // Sem CPF: criar usuário com email único baseado em UUID
            const uid = crypto.randomUUID()
            const { data: newUser, error: userError } = await adminSupabase
                .from('users')
                .insert({
                    tenant_id: tenantId,
                    nome: nome.trim(),
                    email: `walkin.${uid}@nexori.walkin`,
                    role: 'cidadao',
                    tipo: 'cidadao',
                })
                .select('id')
                .single()

            if (userError) throw userError
            userId = newUser.id
        }

        // 2. Verificar se já existe inscrição para esse usuário nessa atividade
        const { data: existingInsc } = await adminSupabase
            .from('inscricoes')
            .select('id')
            .eq('entidade_id', atividadeId)
            .eq('cidadao_id', userId)
            .maybeSingle()

        if (existingInsc) {
            return Response.json({
                inscricao_id: existingInsc.id,
                user_id: userId,
                nome,
                already_exists: true,
            })
        }

        // 3. Criar inscrição walk-in
        const { data: newInsc, error: inscError } = await adminSupabase
            .from('inscricoes')
            .insert({
                entidade_tipo: 'atividade',
                entidade_id: atividadeId,
                cidadao_id: userId,
                status: 'confirmada',
            })
            .select('id')
            .single()

        if (inscError) throw inscError

        return Response.json({
            inscricao_id: newInsc.id,
            user_id: userId,
            nome,
            already_exists: false,
        })

    } catch (error: any) {
        console.error('Walk-in error:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
