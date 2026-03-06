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
            ).catch(err => console.error('WhatsApp Error:', err))
        }

        // 4. Enviar E-mail via Resend
        if (inscricao.users?.email) {
            const { sendEmail } = await import('@/lib/resend')
            await sendEmail({
                to: inscricao.users.email,
                subject: `Inscrição Confirmada: ${titulo}`,
                html: `
                    <div style="font-family: sans-serif; color: #1A3C4A;">
                        <h1 style="color: #2D9E6B;">Olá, ${inscricao.users.nome}!</h1>
                        <p>Sua inscrição no curso/atividade <strong>${titulo}</strong> foi confirmada com sucesso.</p>
                        <div style="background: #f5f7f8; padding: 20px; border-radius: 10px;">
                            <p><strong>Data:</strong> ${data}</p>
                            <p><strong>Local:</strong> ${local}</p>
                        </div>
                        <p style="margin-top: 20px;">Nos vemos lá!</p>
                        <hr />
                        <p style="font-size: 12px; color: #999;">Esta é uma mensagem automática da plataforma Nexori.</p>
                    </div>
                `
            }).catch(err => console.error('Email Error:', err))
        }

        return Response.json({ success: true, id: inscricao.id })

    } catch (error: any) {
        console.error('Inscricao Erro:', error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
