import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
    _req: Request,
    { params }: { params: { turmaId: string } }
) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

    const adminSupabase = createAdminClient()

    const { data, error } = await adminSupabase
        .from('inscricoes')
        .select('id, dados_formulario, telefone_whatsapp, users!cidadao_id(id, nome, email, cpf, whatsapp, rg, data_nascimento, endereco)')
        .eq('turma_id', params.turmaId)
        .eq('status', 'confirmada')

    if (error) return Response.json({ error: error.message }, { status: 500 })

    return Response.json(data)
}
