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
}

interface CertPreviewProps {
    certData: CertData
    corPrimaria: string
    corSecundaria: string
    tenantNome: string
    scale?: number
}

// Valores de exemplo para o preview
const EXEMPLO_ALUNO = 'MARIA DA SILVA SANTOS'
const EXEMPLO_CURSO = '"Capacitação em Gestão de Projetos"'
const EXEMPLO_CODIGO = 'ABC12X45'
const EXEMPLO_CH = '40'

export function CertPreview({ certData, corPrimaria, corSecundaria, tenantNome, scale = 0.42 }: CertPreviewProps) {
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
                            top: 50,
                            left: 60,
                            right: 60,
                            bottom: 130,
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
                            marginBottom: certData.mostrar_carga_horaria ? 8 : 0,
                        }}>
                            {EXEMPLO_CURSO}
                        </div>

                        {/* Carga horária */}
                        {certData.mostrar_carga_horaria && (
                            <div style={{ fontSize: certData.tam_texto - 2, color: textClr }}>
                                com carga horária total de {EXEMPLO_CH} horas.
                            </div>
                        )}
                    </div>

                    {/* Rodapé: data + assinatura */}
                    <div style={{
                        position: 'absolute',
                        bottom: 55,
                        left: 80,
                        right: 80,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                    }}>
                        <div style={{ fontSize: 13, color: textClr }}>
                            Emitido em {new Date().toLocaleDateString('pt-BR')}
                        </div>

                        <div style={{ textAlign: 'center', minWidth: 200 }}>
                            {certData.assinatura_url && (
                                <img
                                    src={certData.assinatura_url}
                                    alt="Assinatura"
                                    style={{ height: 36, objectFit: 'contain', marginBottom: 4, display: 'block', margin: '0 auto 4px' }}
                                />
                            )}
                            <div style={{ borderTop: `1px solid ${primary}`, paddingTop: 6 }}>
                                <div style={{ fontSize: 11, fontStyle: 'italic', color: textClr }}>{responsavel}</div>
                                {certData.cargo_responsavel && (
                                    <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{certData.cargo_responsavel}</div>
                                )}
                            </div>
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
