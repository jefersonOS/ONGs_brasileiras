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
                entidade_id,
                turma_id
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
    let cursoCertConfig: Record<string, string> = {}
    let periodoStr = ''

    if (certificado.inscricoes.entidade_tipo === 'curso') {
        const { data: curso } = await supabase
            .from('cursos')
            .select('titulo, carga_horaria, tenant_id, cert_config')
            .eq('id', certificado.inscricoes.entidade_id)
            .single()
        if (curso) {
            tituloEntidade = curso.titulo
            cargaHoraria = curso.carga_horaria?.toString() || '0'
            tenantId = curso.tenant_id || null
            cursoCertConfig = curso.cert_config || {}
        }

        // Buscar dados da turma para o período
        if (certificado.inscricoes.turma_id) {
            const { data: turma } = await supabase
                .from('turmas')
                .select('data_inicio, data_fim')
                .eq('id', certificado.inscricoes.turma_id)
                .single()
            if (turma && turma.data_inicio && turma.data_fim) {
                const dInicio = new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')
                const dFim = new Date(turma.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')
                periodoStr = `${dInicio} a ${dFim}`
            }
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
                assinatura_url: cfg.cert_assinatura_url || undefined,
                site_validacao: siteValidacao,
                cor_primaria: cfg.cor_primaria || undefined,
                cor_secundaria: cfg.cor_secundaria || undefined,
                titulo: cursoCertConfig.titulo || cfg.cert_titulo || undefined,
                texto_pre: cursoCertConfig.texto_pre || cfg.cert_texto_pre || undefined,
                texto_pos: cursoCertConfig.texto_pos || cfg.cert_texto_pos || undefined,
                texto_complementar: cursoCertConfig.texto_complementar || undefined,
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
                blocos: cfg.cert_blocos?.length ? cfg.cert_blocos : undefined,
                periodo: periodoStr || undefined,
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

        const { searchParams } = new URL(request.url)
        const preview = searchParams.get('preview') === 'true'

        return new NextResponse(Buffer.from(pdfBytes), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': preview
                    ? 'inline'
                    : `attachment; filename="Certificado_${certificado.codigo_validacao}.pdf"`
            }
        })
    } catch (err: any) {
        console.error('Falha ao gerar PDF', err)
        return NextResponse.json({ error: 'Erro ao gerar arquivo PDF' }, { status: 500 })
    }
}
