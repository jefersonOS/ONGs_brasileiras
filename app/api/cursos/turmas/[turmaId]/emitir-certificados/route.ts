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

        // 2. Buscar dados do tenant para personalização do certificado
        const { data: tenant } = await supabase
            .from('tenants')
            .select('nome, slug, dominio_custom, config_portal')
            .eq('id', tenantId)
            .single()

        const cfg = tenant?.config_portal || {}
        // Configurações por curso sobrescrevem o global
        const cursoCfg: Record<string, string> = turma.curso?.cert_config || {}
        const siteValidacao = tenant?.dominio_custom || (tenant?.slug ? `${tenant.slug}.nexori.com.br` : 'nexori.com.br')
        const certConfig = {
            nome_responsavel: cfg.cert_nome_responsavel || undefined,
            cargo_responsavel: cfg.cert_cargo_responsavel || undefined,
            assinatura_url: cfg.cert_assinatura_url || undefined,
            site_validacao: siteValidacao,
            cor_primaria: cfg.cor_primaria || undefined,
            cor_secundaria: cfg.cor_secundaria || undefined,
            titulo: cursoCfg.titulo || cfg.cert_titulo || undefined,
            texto_pre: cursoCfg.texto_pre || cfg.cert_texto_pre || undefined,
            texto_pos: cursoCfg.texto_pos || cfg.cert_texto_pos || undefined,
            texto_complementar: cursoCfg.texto_complementar || undefined,
            fundo_url: cfg.cert_fundo_url || undefined,
            nome_instituicao: cfg.cert_nome_instituicao || undefined,
            alinhamento: cfg.cert_alinhamento || undefined,
            mostrar_borda: cfg.cert_mostrar_borda !== false,
            mostrar_codigo: cfg.cert_mostrar_codigo !== false,
            mostrar_carga_horaria: cfg.cert_mostrar_carga_horaria !== false,
            mostrar_instituicao: cfg.cert_mostrar_instituicao !== false,
            tam_titulo: cfg.cert_tam_titulo || undefined,
            tam_nome: cfg.cert_tam_nome || undefined,
            tam_texto: cfg.cert_tam_texto || undefined,
            tam_instituicao: cfg.cert_tam_instituicao || undefined,
            cor_texto: cfg.cert_cor_texto || undefined,
            cor_nome: cfg.cert_cor_nome || undefined,
            logo_url: cfg.cert_logo_url || undefined,
            pos_y_conteudo: cfg.cert_pos_y_conteudo ?? 0,
            pos_y_rodape: cfg.cert_pos_y_rodape ?? 0,
            pos_x_conteudo: cfg.cert_pos_x_conteudo ?? 0,
            pos_x_rodape: cfg.cert_pos_x_rodape ?? 0,
            nome_mediador: cfg.cert_nome_mediador || undefined,
            cargo_mediador: cfg.cert_cargo_mediador || undefined,
            assinatura_mediador_url: cfg.cert_assinatura_mediador_url || undefined,
            off_x_mediador: cfg.cert_off_x_mediador ?? 0,
            off_y_mediador: cfg.cert_off_y_mediador ?? 0,
            off_x_responsavel: cfg.cert_off_x_responsavel ?? 0,
            off_y_responsavel: cfg.cert_off_y_responsavel ?? 0,
        }
        const nomeInstituicao = tenant?.nome || 'Organização'

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
                nomeInstituicao,
                codigo,
                certConfig
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
