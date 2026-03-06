import { createClient } from '@/lib/supabase/server'
import { WhatsAppService } from '@/lib/whatsapp-service'

export async function GET(req: Request) {
    // Verificar token do Vercel Cron se necessário
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
        return new Response('Não autorizado', { status: 401 })
    }

    const supabase = createClient()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    try {
        // 1. Buscar inscrições de Cursos com encontro amanhã
        const { data: turmasAmanha } = await supabase
            .from('turmas')
            .select('*, curso:cursos(*)')
            .filter('encontros', 'cs', `[{"data": "${tomorrowStr}"}]`)

        for (const turma of turmasAmanha || []) {
            const { data: inscritos } = await supabase
                .from('inscricoes')
                .select('*, users!cidadao_id(*)')
                .eq('turma_id', turma.id)
                .eq('status', 'confirmada')

            const encontro = turma.encontros.find((e: any) => e.data === tomorrowStr)

            for (const ins of inscritos || []) {
                if (ins.users?.whatsapp) {
                    await WhatsAppService.enviar(
                        turma.tenant_id,
                        ins.users.whatsapp,
                        'lembrete_24h',
                        {
                            evento: turma.curso.titulo,
                            data: tomorrow.toLocaleDateString('pt-BR'),
                            horario: encontro.hora_inicio,
                            local: encontro.local || 'Sede da ONG'
                        }
                    )
                }
            }
        }

        // 2. Buscar inscrições de Atividades com data amanhã
        // Similar logic for activities...
        // Nota: Simplificado para o MVP focado em cursos conforme solicitado no refinamento 5/6

        return Response.json({ success: true, message: 'Lembretes processados' })

    } catch (error: any) {
        console.error('Cron Reminders Error:', error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}
