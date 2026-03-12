import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { WhatsAppService } from '@/lib/whatsapp-service'

export async function POST(req: Request) {
    try {
        const { tipo, id, turmaId, cidadaoId, tenantId, dadosFormulario, formulario, telefoneWhatsApp, cpf } = await req.json()
        const supabase = createClient()
        const adminSupabase = createAdminClient()

        // Garantir que o usuário existe em public.users antes de inserir a inscrição
        // (pode não existir ainda se o trigger do Supabase ainda não executou após o cadastro)
        const { data: authUser } = await adminSupabase.auth.admin.getUserById(cidadaoId)
        if (authUser?.user) {
            const u = authUser.user
            await adminSupabase.from('users').upsert({
                id: u.id,
                email: u.email,
                nome: u.user_metadata?.nome || '',
                tipo: u.user_metadata?.tipo || 'cidadao',
                role: u.user_metadata?.role || 'cidadao',
                tenant_id: u.user_metadata?.tenant_id || tenantId || null,
                ativo: true,
            }, { onConflict: 'id', ignoreDuplicates: true })

            // Garante tenant_id para cidadãos que se cadastraram sem ele
            if (tenantId && !u.user_metadata?.tenant_id) {
                await adminSupabase.from('users')
                    .update({ tenant_id: tenantId })
                    .eq('id', u.id)
                    .is('tenant_id', null)
            }

            // Salva CPF e WhatsApp do formulário de inscrição no perfil do usuário
            const cpfToSave = cpf || (() => {
                if (!formulario || !dadosFormulario) return null
                const campoCPF = formulario.find((c: any) => c.label?.toLowerCase().includes('cpf'))
                return campoCPF ? dadosFormulario[campoCPF.id] || null : null
            })()
            const whatsappToSave = telefoneWhatsApp || (() => {
                if (!formulario || !dadosFormulario) return null
                const campoWa = formulario.find((c: any) => c.is_whatsapp)
                return campoWa ? dadosFormulario[campoWa.id] || null : null
            })()
            if (cpfToSave || whatsappToSave) {
                const updates: Record<string, string> = {}
                if (cpfToSave) updates.cpf = cpfToSave.replace(/\D/g, '')
                if (whatsappToSave) updates.whatsapp = whatsappToSave
                await adminSupabase.from('users').update(updates).eq('id', cidadaoId)
            }
        }

        // 1. Criar Inscrição com dados do formulário
        const { data: inscricao, error: insError } = await supabase
            .from('inscricoes')
            .insert({
                entidade_tipo: tipo,
                entidade_id: id,
                turma_id: turmaId || null,
                cidadao_id: cidadaoId,
                status: 'confirmada',
                dados_formulario: dadosFormulario || null,
                telefone_whatsapp: telefoneWhatsApp || null,
            })
            .select('*, users!cidadao_id(*)')
            .single()

        if (insError) throw insError

        // 2. Buscar dados do curso/atividade para a mensagem
        let titulo = ''
        let data = 'A conferir'
        let local = 'A combinar'

        if (tipo === 'curso') {
            const { data: curso } = await supabase.from('cursos').select('titulo').eq('id', id).single()
            titulo = curso?.titulo || ''
            if (turmaId) {
                const { data: turma } = await supabase.from('turmas').select('data_inicio, data_fim').eq('id', turmaId).single()
                if (turma?.data_inicio) {
                    data = new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')
                    if (turma.data_fim) data += ` a ${new Date(turma.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}`
                }
            }
        } else {
            const { data: atividade } = await supabase.from('atividades').select('titulo, locais, datas').eq('id', id).single()
            titulo = atividade?.titulo || ''
            if (atividade?.datas?.[0]) data = new Date(atividade.datas[0].data).toLocaleDateString('pt-BR')
            if (atividade?.locais?.[0]) local = atividade.locais[0].rua || 'Sede da ONG'
        }

        // 3. Enviar WhatsApp
        // Prioridade: telefone capturado no formulário → whatsapp do perfil
        const whatsappDestino = telefoneWhatsApp || inscricao.users?.whatsapp
        const nomeDestinatario = inscricao.users?.nome || (dadosFormulario ? Object.values(dadosFormulario)[0] as string : '') || 'Participante'

        if (whatsappDestino) {
            await WhatsAppService.enviar(
                tenantId,
                whatsappDestino,
                'inscricao_confirmada',
                {
                    nome: nomeDestinatario,
                    evento: titulo,
                    data,
                    local
                }
            ).catch(err => console.error('WhatsApp Error:', err))
        }

        // 4. Enviar E-mail via Resend
        const emailDestino = inscricao.users?.email
        if (emailDestino) {
            const { sendEmail } = await import('@/lib/resend')
            await sendEmail({
                to: emailDestino,
                subject: `Inscrição Confirmada: ${titulo}`,
                html: `
                    <div style="font-family: sans-serif; color: #1A3C4A;">
                        <h1 style="color: #2D9E6B;">Olá, ${nomeDestinatario}!</h1>
                        <p>Sua inscrição em <strong>${titulo}</strong> foi confirmada com sucesso.</p>
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
