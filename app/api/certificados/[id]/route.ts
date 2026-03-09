import { createClient } from '@/lib/supabase/server'
import { PDFService } from '@/lib/pdf-service'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const supabase = createClient()
    const id = params.id

    // Verificar se o usuário autenticado é o dono do certificado (ou admin/gestor)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: certificado, error } = await supabase
        .from('certificados')
        .select(`
            *,
            users!cidadao_id (nome, cpf),
            inscricoes!inscricao_id (
                entidade_tipo,
                entidade_id
            )
        `)
        .eq('id', id)
        .single()

    if (error || !certificado) {
        return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 })
    }

    // Apenas o dono pode baixar (para MVP)
    if (certificado.cidadao_id !== user.id && user.user_metadata?.role === 'cidadao') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Buscar os dados da entidade
    let tituloEntidade = 'Evento'
    let cargaHoraria = '0'
    let tenantId: string | null = null
    let certConfig: any = {}
    let nomeInstituicao = 'Organização'

    if (certificado.inscricoes.entidade_tipo === 'curso') {
        const { data: curso } = await supabase
            .from('cursos')
            .select('titulo, carga_horaria, tenant_id')
            .eq('id', certificado.inscricoes.entidade_id)
            .single()
        if (curso) {
            tituloEntidade = curso.titulo
            cargaHoraria = curso.carga_horaria?.toString() || '0'
            tenantId = curso.tenant_id || null
        }
    } else {
        const { data: atividade } = await supabase
            .from('atividades')
            .select('titulo, tenant_id')
            .eq('id', certificado.inscricoes.entidade_id)
            .single()
        if (atividade) {
            tituloEntidade = atividade.titulo
            tenantId = atividade.tenant_id || null
        }
    }

    if (tenantId) {
        const { data: tenant } = await supabase
            .from('tenants')
            .select('nome, slug, dominio_custom, config_portal')
            .eq('id', tenantId)
            .single()
        if (tenant) {
            nomeInstituicao = tenant.nome || 'Organização'
            const cfg = tenant.config_portal || {}
            const siteValidacao = tenant.dominio_custom || (tenant.slug ? `${tenant.slug}.nexori.com.br` : 'nexori.com.br')
            certConfig = {
                nome_responsavel: cfg.cert_nome_responsavel || undefined,
                cargo_responsavel: cfg.cert_cargo_responsavel || undefined,
                site_validacao: siteValidacao,
                cor_primaria: cfg.cor_primaria || undefined,
                cor_secundaria: cfg.cor_secundaria || undefined,
                titulo: cfg.cert_titulo || undefined,
                texto_pre: cfg.cert_texto_pre || undefined,
                texto_pos: cfg.cert_texto_pos || undefined,
                fundo_url: cfg.cert_fundo_url || undefined,
            }
        }
    }

    try {
        const pdfBytes = await PDFService.generateCertificate(
            certificado.users?.nome || 'Cidadão',
            tituloEntidade,
            certificado.tipo as 'certificado' | 'comprovante',
            new Date(certificado.emitido_em),
            cargaHoraria,
            nomeInstituicao,
            certificado.codigo_validacao,
            certConfig
        )

        return new NextResponse(Buffer.from(pdfBytes), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Certificado_${certificado.codigo_validacao}.pdf"`
            }
        })
    } catch (err: any) {
        console.error('Falha ao gerar PDF', err)
        return NextResponse.json({ error: 'Erro ao gerar arquivo PDF' }, { status: 500 })
    }
}
