'use client'

interface CertData {
    titulo: string
    nome_instituicao: string
    texto_pre: string
    texto_pos: string
    site_validacao: string
    nome_responsavel: string
    cargo_responsavel: string
    assinatura_url: string
    fundo_url: string
    logo_url: string
    alinhamento: string
    mostrar_borda: boolean
    mostrar_codigo: boolean
    mostrar_carga_horaria: boolean
    mostrar_instituicao: boolean
    tam_titulo: number
    tam_nome: number
    tam_texto: number
    tam_instituicao: number
    cor_texto: string
    cor_nome: string
    texto_complementar: string
    pos_y_conteudo: number
    pos_y_rodape: number
    pos_x_conteudo: number
    pos_x_rodape: number
    nome_mediador: string
    cargo_mediador: string
    assinatura_mediador_url: string
    off_x_mediador: number
    off_y_mediador: number
    off_x_responsavel: number
    off_y_responsavel: number
}

interface CertPreviewProps {
    certData: CertData
    corPrimaria: string
    corSecundaria: string
    tenantNome: string
    scale?: number
    exemploAluno?: string
    exemploCurso?: string
    exemploCH?: string
}

const DEFAULT_ALUNO = 'MARIA DA SILVA SANTOS'
const DEFAULT_CURSO = 'Capacitação em Gestão de Projetos'
const EXEMPLO_CODIGO = 'ABC12X45'

export function CertPreview({ certData, corPrimaria, corSecundaria, tenantNome, scale = 0.42, exemploAluno, exemploCurso, exemploCH }: CertPreviewProps) {
    const EXEMPLO_ALUNO = exemploAluno || DEFAULT_ALUNO
    const EXEMPLO_CURSO = `"${exemploCurso || DEFAULT_CURSO}"`
    const EXEMPLO_CH = exemploCH || '40'
    const W = 841.89
    const H = 595.28

    const primary = corPrimaria || '#1A3C4A'
    const secondary = corSecundaria || '#2D9E6B'
    const textClr = certData.cor_texto || '#4D4D4D'
    const nameClr = certData.cor_nome || secondary
    const nomeInst = certData.nome_instituicao || tenantNome || 'NOME DA INSTITUIÇÃO'
    const titulo = certData.titulo || 'CERTIFICADO DE CONCLUSÃO'
    const textoPre = certData.texto_pre || 'Certificamos que'
    const textoPos = certData.texto_pos || 'concluiu com êxito o curso de'
    const responsavel = certData.nome_responsavel || 'Assinatura Eletrônica / Coordenação'
    const siteVal = certData.site_validacao || 'portal.nexori.com.br'

    const textAlign = certData.alinhamento === 'esquerda' ? 'left' as const
        : certData.alinhamento === 'direita' ? 'right' as const
        : 'center' as const
    const alignItems = certData.alinhamento === 'esquerda' ? 'flex-start'
        : certData.alinhamento === 'direita' ? 'flex-end'
        : 'center'
    const posYConteudo = certData.pos_y_conteudo || 0
    const posYRodape = certData.pos_y_rodape || 0
    const posXConteudo = certData.pos_x_conteudo || 0
    const posXRodape = certData.pos_x_rodape || 0
    const offXMed = certData.off_x_mediador || 0
    const offYMed = certData.off_y_mediador || 0
    const offXResp = certData.off_x_responsavel || 0
    const offYResp = certData.off_y_responsavel || 0

    const outerW = Math.round(W * scale)
    const outerH = Math.round(H * scale)

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preview em Tempo Real</p>
                <span className="text-[9px] font-bold text-gray-300 bg-gray-100 px-2 py-1 rounded-full">Dados de exemplo</span>
            </div>

            {/* Container com dimensões escaladas */}
            <div
                className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/20 border border-gray-200"
                style={{ width: outerW, height: outerH }}
            >
                {/* Certificado em tamanho real, escalado via transform */}
                <div
                    style={{
                        width: W,
                        height: H,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                        backgroundColor: '#fff',
                        overflow: 'hidden',
                    }}
                >
                    {/* Fundo */}
                    {certData.fundo_url && (
                        <img
                            src={certData.fundo_url}
                            alt=""
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}

                    {/* Bordas decorativas */}
                    {certData.mostrar_borda && (
                        <>
                            <div style={{ position: 'absolute', inset: 20, border: `4px solid ${primary}`, pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', inset: 30, border: `1px solid ${secondary}`, pointerEvents: 'none' }} />
                        </>
                    )}

                    {/* Logo */}
                    {certData.logo_url && (
                        <img
                            src={certData.logo_url}
                            alt="Logo"
                            style={{ position: 'absolute', top: 28, left: 60, height: 60, objectFit: 'contain' }}
                        />
                    )}

                    {/* Área de conteúdo central */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 50 - posYConteudo,
                            left: 60 + posXConteudo,
                            right: 60 - posXConteudo,
                            bottom: 130 + posYConteudo,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems,
                            textAlign,
                            justifyContent: 'center',
                            gap: 0,
                        }}
                    >
                        {/* Nome da instituição */}
                        {certData.mostrar_instituicao && (
                            <div style={{
                                fontSize: certData.tam_instituicao,
                                fontWeight: 900,
                                color: primary,
                                letterSpacing: 3,
                                marginBottom: 20,
                                textTransform: 'uppercase',
                            }}>
                                {nomeInst}
                            </div>
                        )}

                        {/* Título */}
                        <div style={{
                            fontSize: certData.tam_titulo,
                            fontWeight: 900,
                            color: primary,
                            letterSpacing: 1,
                            marginBottom: 22,
                        }}>
                            {titulo}
                        </div>

                        {/* Linha decorativa */}
                        <div style={{
                            width: textAlign === 'center' ? '50%' : '40%',
                            height: 3,
                            backgroundColor: secondary,
                            marginBottom: 24,
                            alignSelf: alignItems,
                        }} />

                        {/* Texto pré */}
                        <div style={{ fontSize: certData.tam_texto, color: textClr, marginBottom: 10 }}>
                            {textoPre}
                        </div>

                        {/* Nome do aluno */}
                        <div style={{
                            fontSize: certData.tam_nome,
                            fontWeight: 900,
                            color: nameClr,
                            marginBottom: 12,
                        }}>
                            {EXEMPLO_ALUNO}
                        </div>

                        {/* Texto pós */}
                        <div style={{ fontSize: certData.tam_texto, color: textClr, marginBottom: 8 }}>
                            {textoPos}
                        </div>

                        {/* Nome do curso */}
                        <div style={{
                            fontSize: Math.min(certData.tam_texto + 6, 26),
                            fontWeight: 700,
                            color: primary,
                            marginBottom: 8,
                        }}>
                            {EXEMPLO_CURSO}
                        </div>

                        {/* Texto complementar livre */}
                        {certData.texto_complementar && (
                            <div style={{ fontSize: certData.tam_texto - 2, color: textClr, marginBottom: 6, fontStyle: 'italic' }}>
                                {certData.texto_complementar}
                            </div>
                        )}

                        {/* Carga horária */}
                        {certData.mostrar_carga_horaria && (
                            <div style={{ fontSize: certData.tam_texto - 2, color: textClr }}>
                                com carga horária total de {EXEMPLO_CH} horas.
                            </div>
                        )}
                    </div>

                    {/* Rodapé: blocos posicionados individualmente */}
                    {/* Data */}
                    <div style={{
                        position: 'absolute',
                        bottom: certData.nome_mediador ? 18 + posYRodape : 55 + posYRodape,
                        left: 0, right: 0,
                        textAlign: 'center',
                        fontSize: certData.nome_mediador ? 10 : 13,
                        color: textClr,
                        transform: `translateX(${posXRodape}px)`,
                    }}>
                        Emitido em {new Date().toLocaleDateString('pt-BR')}
                    </div>

                    {/* Mediador(a) — esquerda, só se preenchido */}
                    {certData.nome_mediador && (
                        <div style={{
                            position: 'absolute',
                            bottom: 55 + posYRodape,
                            left: 80 + posXRodape,
                            textAlign: 'center',
                            minWidth: 200,
                            transform: `translate(${offXMed}px, ${-offYMed}px)`,
                        }}>
                            {certData.assinatura_mediador_url && (
                                <img
                                    src={certData.assinatura_mediador_url}
                                    alt="Assinatura mediador"
                                    style={{ height: 36, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }}
                                />
                            )}
                            <div style={{ borderTop: `1px solid ${primary}`, paddingTop: 6 }}>
                                <div style={{ fontSize: 11, fontStyle: 'italic', color: textClr }}>{certData.nome_mediador}</div>
                                {certData.cargo_mediador && (
                                    <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{certData.cargo_mediador}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Responsável — direita */}
                    <div style={{
                        position: 'absolute',
                        bottom: 55 + posYRodape,
                        right: 80 - posXRodape,
                        textAlign: 'center',
                        minWidth: 200,
                        transform: `translate(${-offXResp}px, ${-offYResp}px)`,
                    }}>
                        {certData.assinatura_url && (
                            <img
                                src={certData.assinatura_url}
                                alt="Assinatura"
                                style={{ height: 36, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }}
                            />
                        )}
                        <div style={{ borderTop: `1px solid ${primary}`, paddingTop: 6 }}>
                            <div style={{ fontSize: 11, fontStyle: 'italic', color: textClr }}>{responsavel}</div>
                            {certData.cargo_responsavel && (
                                <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{certData.cargo_responsavel}</div>
                            )}
                        </div>
                    </div>

                    {/* Código de validação */}
                    {certData.mostrar_codigo && (
                        <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: '#aaa' }}>Código de Autenticação: {EXEMPLO_CODIGO}</div>
                            <div style={{ fontSize: 9, color: '#aaa' }}>Verificável em: {siteVal}/validar/{EXEMPLO_CODIGO}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
