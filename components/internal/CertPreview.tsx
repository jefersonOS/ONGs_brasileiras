'use client'

import { BlocoCert } from '@/lib/pdf-service'

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
    blocos?: BlocoCert[]
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
const EXEMPLO_PERIODO = '01/03/2025 a 30/04/2025'

function resolveTokens(texto: string, vals: Record<string, string>): string {
    return texto.replace(/\{\{(\w+)\}\}/g, (_, k) => vals[k] ?? ('{{' + k + '}}'))
}

export function CertPreview({ certData, blocos, corPrimaria, corSecundaria, tenantNome, scale = 0.42, exemploAluno, exemploCurso, exemploCH }: CertPreviewProps) {
    const EXEMPLO_ALUNO = exemploAluno || DEFAULT_ALUNO
    const EXEMPLO_CURSO = exemploCurso || DEFAULT_CURSO
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
    const usaBlocos = blocos && blocos.length > 0

    const previewTokens: Record<string, string> = {
        nome: EXEMPLO_ALUNO.toUpperCase(),
        curso: EXEMPLO_CURSO,
        carga_horaria: EXEMPLO_CH,
        data_emissao: new Date().toLocaleDateString('pt-BR'),
        instituicao: nomeInst,
        codigo: EXEMPLO_CODIGO,
        periodo: EXEMPLO_PERIODO,
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preview em Tempo Real</p>
                <div className="flex items-center gap-2">
                    {usaBlocos && (
                        <span className="text-[9px] font-black text-[#2D9E6B] bg-green-50 px-2 py-1 rounded-full border border-green-100">Modo Blocos</span>
                    )}
                    <span className="text-[9px] font-bold text-gray-300 bg-gray-100 px-2 py-1 rounded-full">Dados de exemplo</span>
                </div>
            </div>

            <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/20 border border-gray-200"
                style={{ width: outerW, height: outerH }}>
                <div style={{
                    width: W, height: H,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    position: 'absolute', top: 0, left: 0,
                    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                    backgroundColor: '#fff', overflow: 'hidden',
                }}>
                    {certData.fundo_url && (
                        <img src={certData.fundo_url} alt=""
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}

                    {certData.mostrar_borda && (
                        <>
                            <div style={{ position: 'absolute', inset: 20, border: `4px solid ${primary}`, pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', inset: 30, border: `1px solid ${secondary}`, pointerEvents: 'none' }} />
                        </>
                    )}

                    {certData.logo_url && (
                        <img src={certData.logo_url} alt="Logo"
                            style={{ position: 'absolute', top: 28, left: 60, height: 60, objectFit: 'contain' }} />
                    )}

                    {usaBlocos ? (
                        blocos!.map(bloco => {
                            const texto = resolveTokens(bloco.texto, previewTokens)
                            return (
                                <div key={bloco.id} style={{
                                    position: 'absolute',
                                    top: bloco.y,
                                    ...(bloco.alinhamento === 'centro'
                                        ? { left: 0, right: 0, textAlign: 'center' as const }
                                        : bloco.alinhamento === 'direita'
                                        ? { right: bloco.x, textAlign: 'right' as const }
                                        : { left: bloco.x, textAlign: 'left' as const }),
                                    fontSize: bloco.tam,
                                    fontWeight: bloco.negrito ? 900 : 400,
                                    fontStyle: bloco.italico ? 'italic' : 'normal',
                                    color: bloco.cor || textClr,
                                    lineHeight: 1.4,
                                    whiteSpace: 'pre-wrap',
                                    pointerEvents: 'none',
                                }}>
                                    {texto}
                                </div>
                            )
                        })
                    ) : (
                        <div style={{
                            position: 'absolute',
                            top: 50 - posYConteudo, left: 60 + posXConteudo,
                            right: 60 - posXConteudo, bottom: 130 + posYConteudo,
                            display: 'flex', flexDirection: 'column',
                            alignItems, textAlign, justifyContent: 'center', gap: 0,
                        }}>
                            {certData.mostrar_instituicao && (
                                <div style={{ fontSize: certData.tam_instituicao, fontWeight: 900, color: primary, letterSpacing: 3, marginBottom: 20, textTransform: 'uppercase' }}>
                                    {nomeInst}
                                </div>
                            )}
                            <div style={{ fontSize: certData.tam_titulo, fontWeight: 900, color: primary, letterSpacing: 1, marginBottom: 22 }}>{titulo}</div>
                            <div style={{ width: textAlign === 'center' ? '50%' : '40%', height: 3, backgroundColor: secondary, marginBottom: 24, alignSelf: alignItems }} />
                            <div style={{ fontSize: certData.tam_texto, color: textClr, marginBottom: 10 }}>{textoPre}</div>
                            <div style={{ fontSize: certData.tam_nome, fontWeight: 900, color: nameClr, marginBottom: 12 }}>{EXEMPLO_ALUNO}</div>
                            <div style={{ fontSize: certData.tam_texto, color: textClr, marginBottom: 8 }}>{textoPos}</div>
                            <div style={{ fontSize: Math.min(certData.tam_texto + 6, 26), fontWeight: 700, color: primary, marginBottom: 8 }}>
                                &ldquo;{EXEMPLO_CURSO}&rdquo;
                            </div>
                            {certData.texto_complementar && (
                                <div style={{ fontSize: certData.tam_texto - 2, color: textClr, marginBottom: 6, fontStyle: 'italic' }}>
                                    {certData.texto_complementar}
                                </div>
                            )}
                            {certData.mostrar_carga_horaria && (
                                <div style={{ fontSize: certData.tam_texto - 2, color: textClr }}>
                                    com carga horária total de {EXEMPLO_CH} horas.
                                </div>
                            )}
                        </div>
                    )}

                    <div style={{
                        position: 'absolute',
                        bottom: certData.nome_mediador ? 18 + posYRodape : 55 + posYRodape,
                        left: 0, right: 0, textAlign: 'center',
                        fontSize: certData.nome_mediador ? 10 : 13,
                        color: textClr,
                        transform: `translateX(${posXRodape}px)`,
                    }}>
                        Emitido em {new Date().toLocaleDateString('pt-BR')}
                    </div>

                    {certData.nome_mediador && (
                        <div style={{
                            position: 'absolute', bottom: 55,
                            left: 80, textAlign: 'center', minWidth: 200,
                            transform: `translate(${offXMed}px, ${-offYMed}px)`,
                        }}>
                            {certData.assinatura_mediador_url && (
                                <img src={certData.assinatura_mediador_url} alt="Assinatura mediador"
                                    style={{ height: 36, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />
                            )}
                            <div style={{ borderTop: `1px solid ${primary}`, paddingTop: 6 }}>
                                <div style={{ fontSize: 11, fontStyle: 'italic', color: textClr }}>{certData.nome_mediador}</div>
                                {certData.cargo_mediador && <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{certData.cargo_mediador}</div>}
                            </div>
                        </div>
                    )}

                    <div style={{
                        position: 'absolute', bottom: 55,
                        right: 80, textAlign: 'center', minWidth: 200,
                        transform: `translate(${-offXResp}px, ${-offYResp}px)`,
                    }}>
                        {certData.assinatura_url && (
                            <img src={certData.assinatura_url} alt="Assinatura"
                                style={{ height: 36, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} />
                        )}
                        <div style={{ borderTop: `1px solid ${primary}`, paddingTop: 6 }}>
                            <div style={{ fontSize: 11, fontStyle: 'italic', color: textClr }}>{responsavel}</div>
                            {certData.cargo_responsavel && <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{certData.cargo_responsavel}</div>}
                        </div>
                    </div>

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
