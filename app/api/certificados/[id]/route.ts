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

    if (certificado.inscricoes.entidade_tipo === 'curso') {
        const { data: curso } = await supabase.from('cursos').select('titulo, carga_horaria').eq('id', certificado.inscricoes.entidade_id).single()
        if (curso) {
            tituloEntidade = curso.titulo
            cargaHoraria = curso.carga_horaria?.toString() || '0'
        }
    } else {
        const { data: atividade } = await supabase.from('atividades').select('titulo').eq('id', certificado.inscricoes.entidade_id).single()
        if (atividade) {
            tituloEntidade = atividade.titulo
        }
    }

    // Nome Instituição - Para buscar o org precisariamos ler o Tenant. 
    // Como o certificado tem tenant no top level (ou indiretamente pelo User/Entidade), 
    // vamos fixar para MVP ou ler do primeiro tenant encontrado, já que o PDF rodará em multi-tenant isolado e aqui estamos simplificando
    const nomeInstituicao = "Organização NGO Brasil"

    try {
        const pdfBytes = await PDFService.generateCertificate(
            certificado.users?.nome || 'Cidadão',
            tituloEntidade,
            certificado.tipo as 'certificado' | 'comprovante',
            new Date(certificado.emitido_em),
            cargaHoraria,
            nomeInstituicao,
            certificado.codigo_validacao
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
