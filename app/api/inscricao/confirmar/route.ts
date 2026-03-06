import { createClient } from '@/lib/supabase/server'
import { WhatsAppService } from '@/lib/whatsapp-service'

export async function POST(req: Request) {
    try {
        const { tipo, id, turmaId, cidadaoId, tenantId } = await req.json()
        const supabase = createClient()

        // 1. Criar Inscrição
        const { data: inscricao, error: insError } = await supabase
            .from('inscricoes')
            .insert({
                entidade_tipo: tipo,
                entidade_id: id,
                turma_id: turmaId || null,
                cidadao_id: cidadaoId,
                status: 'confirmada'
            })
            .select('*, users!cidadao_id(*)')
            .single()

        if (insError) throw insError

        // 2. Buscar Dados do Evento/Curso para a mensagem
        let titulo = ''
        let data = 'A conferir'
        let local = 'A combinar'

        if (tipo === 'curso') {
            const { data: curso } = await supabase.from('cursos').select('titulo').eq('id', id).single()
            titulo = curso?.titulo || ''
            if (turmaId) {
                const { data: turma } = await supabase.from('turmas').select('encontros').eq('id', turmaId).single()
                const primeiroIdx = turma?.encontros?.[0]
                if (primeiroIdx) {
                    data = new Date(primeiroIdx.data).toLocaleDateString('pt-BR')
                    local = primeiroIdx.local || 'Sede da ONG'
                }
            }
        } else {
            const { data: atividade } = await supabase.from('atividades').select('titulo, locais, datas').eq('id', id).single()
            titulo = atividade?.titulo || ''
            if (atividade?.datas?.[0]) data = new Date(atividade.datas[0].data).toLocaleDateString('pt-BR')
            if (atividade?.locais?.[0]) local = atividade.locais[0].rua || 'Sede da ONG'
        }

        // 3. Enviar WhatsApp
        if (inscricao.users?.whatsapp) {
            await WhatsAppService.enviar(
                tenantId,
                inscricao.users.whatsapp,
                'inscricao_confirmada',
                {
                    nome: inscricao.users.nome,
                    evento: titulo,
                    data,
                    local
                }
            )
        }

        return Response.json({ success: true, id: inscricao.id })

    } catch (error: any) {
        console.error('Inscricao Erro:', error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
