import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PDFService } from '@/lib/pdf-service'
import { WhatsAppService } from '@/lib/whatsapp-service'

export async function POST(req: Request, { params }: { params: { turmaId: string } }) {
    try {
        const { turmaId } = params
        const { inscritosIds, tenantId } = await req.json()
        const supabase = createClient()
        const adminSupabase = createAdminClient()

        // 1. Buscar dados da turma e curso
        const { data: turma } = await supabase
            .from('turmas')
            .select('*, curso:cursos(*)')
            .eq('id', turmaId)
            .single()

        if (!turma) return new Response('Turma não encontrada', { status: 404 })

        const results = []

        for (const inscricaoId of inscritosIds) {
            // Buscar inscrito
            const { data: inscricao } = await supabase
                .from('inscricoes')
                .select('*, users(*)')
                .eq('id', inscricaoId)
                .single()

            if (!inscricao) continue

            const codigo = Math.random().toString(36).substring(2, 10).toUpperCase()

            // Gerar PDF
            const pdfBytes = await PDFService.generateCertificate(
                inscricao.users.nome,
                turma.curso.titulo,
                'certificado',
                new Date(),
                turma.curso.carga_horaria || 0,
                'Organização NGO Brasil', // Idealmente viria do tenant
                codigo
            )

            // Upload PDF via admin client (bypasses RLS)
            const fileName = `${tenantId}/certificados/${codigo}.pdf`
            const { error: uploadError } = await adminSupabase.storage
                .from('certificados')
                .upload(fileName, pdfBytes, {
                    contentType: 'application/pdf',
                    upsert: true
                })

            if (uploadError) {
                console.error('Upload error:', uploadError)
                continue
            }

            const { data: { publicUrl } } = adminSupabase.storage.from('certificados').getPublicUrl(fileName)

            // Salvar no Banco
            const { data: cert, error: certError } = await adminSupabase.from('certificados').insert({
                inscricao_id: inscricao.id,
                cidadao_id: inscricao.users.id,
                tipo: 'certificado',
                codigo_validacao: codigo,
                url_pdf: publicUrl,
                status: 'valido'
            }).select().single()

            if (!certError) {
                results.push(cert)

                // Enviar WhatsApp
                if (inscricao.users.whatsapp) {
                    await WhatsAppService.enviar(
                        tenantId,
                        inscricao.users.whatsapp,
                        'certificado_disponivel',
                        {
                            curso: turma.curso.titulo,
                            link: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nexori.com'}/validar/${codigo}`
                        }
                    )
                }
            }
        }

        return Response.json({ success: true, count: results.length })

    } catch (error: any) {
        console.error('Batch Issuance Error:', error)
        return new Response(error.message, { status: 500 })
    }
}
