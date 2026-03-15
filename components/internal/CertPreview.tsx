'use client'

import { useRef, useEffect } from 'react'
import { BlocoCert, FONTES_CERT } from '@/lib/pdf-service'

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
    hideLabels?: boolean
    // Modo edição interativa
    editable?: boolean
    selectedId?: string
    onSelectBloco?: (id: string | null) => void
    onUpdateBloco?: (id: string, patch: Partial<BlocoCert>) => void
}

const DEFAULT_ALUNO = 'Maria da Silva Santos'
const DEFAULT_CURSO = 'Capacitação em Gestão de Projetos'
const EXEMPLO_CODIGO = 'ABC12X45'
const EXEMPLO_PERIODO = '01/03/2025 a 30/04/2025'

function resolveTokens(texto: string, vals: Record<string, string>): string {
    return texto.replace(/\{\{(\w+)\}\}/g, (_, k) => vals[k] ?? ('{{' + k + '}}'))
}

function RichText({ text, style }: { text: string, style: React.CSSProperties }) {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return (
        <span style={style}>
            {parts.map((part, i) =>
                part.startsWith('**') && part.endsWith('**')
                    ? <strong key={i}>{part.slice(2, -2)}</strong>
                    : <span key={i}>{part}</span>
            )}
        </span>
    )
}

export function CertPreview({
    certData, blocos, corPrimaria, corSecundaria, tenantNome,
    scale = 0.42, exemploAluno, exemploCurso, exemploCH, hideLabels,
    editable, selectedId, onSelectBloco, onUpdateBloco,
}: CertPreviewProps) {
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
    const subtitulo = certData.texto_pre || 'ESTE CERTIFICADO COMPROVA QUE'
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
    const offXResp = certData.off_x_responsavel || 0
    const offYResp = certData.off_y_responsavel || 0

    const outerW = Math.round(W * scale)
    const outerH = Math.round(H * scale)
    const usaBlocos = blocos && blocos.length > 0

    const previewTokens: Record<string, string> = {
        nome: EXEMPLO_ALUNO,
        curso: EXEMPLO_CURSO,
        carga_horaria: EXEMPLO_CH,
        data_emissao: new Date().toLocaleDateString('pt-BR'),
        instituicao: nomeInst,
        codigo: EXEMPLO_CODIGO,
        periodo: EXEMPLO_PERIODO,
        tipo_turma: 'Curso',
    }

    // Texto principal do corpo — espelha o formato do pdf-service.ts
    const bodyText = certData.texto_pos
        ? certData.texto_pos
            .replace(/\{\{curso\}\}/g, EXEMPLO_CURSO.toUpperCase())
            .replace(/\{\{periodo\}\}/g, EXEMPLO_PERIODO)
            .replace(/\{\{carga_horaria\}\}/g, EXEMPLO_CH)
            .replace(/\{\{nome\}\}/g, EXEMPLO_ALUNO)
            .replace(/\{\{instituicao\}\}/g, nomeInst)
        : `CONCLUIU COM ÊXITO O **CURSO DE ${EXEMPLO_CURSO.toUpperCase()}**. OFERECIDO NO **PERIODO DE ${EXEMPLO_PERIODO}**. COM **CARGA HORÁRIA DE ${EXEMPLO_CH}H**.`

    // Load Google Fonts for custom font preview
    useEffect(() => {
        const href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Cinzel:wght@400;700&family=Great+Vibes&family=Dancing+Script:wght@400;700&family=Alex+Brush&display=swap'
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.href = href
            document.head.appendChild(link)
        }
    }, [])

    // ── Drag state ─────────────────────────────────────────────────────────
    const containerRef = useRef<HTMLDivElement>(null)
    const dragRef = useRef<{
        id: string
        startMouseX: number
        startMouseY: number
        startBlocoX: number
        startBlocoY: number
        alignment: 'esquerda' | 'centro' | 'direita'
    } | null>(null)
    const isDragging = useRef(false)

    const handleBlocoMouseDown = (e: React.MouseEvent, bloco: BlocoCert) => {
        if (!editable) return
        e.preventDefault()
        e.stopPropagation()
        onSelectBloco?.(bloco.id)
        const rect = containerRef.current!.getBoundingClientRect()
        dragRef.current = {
            id: bloco.id,
            startMouseX: e.clientX - rect.left,
            startMouseY: e.clientY - rect.top,
            startBlocoX: bloco.x,
            startBlocoY: bloco.y,
            alignment: bloco.alinhamento,
        }
        isDragging.current = false
    }

    const handleContainerMouseMove = (e: React.MouseEvent) => {
        if (!dragRef.current || !containerRef.current || !onUpdateBloco) return
        const rect = containerRef.current.getBoundingClientRect()
        const deltaX = (e.clientX - rect.left - dragRef.current.startMouseX) / scale
        const deltaY = (e.clientY - rect.top - dragRef.current.startMouseY) / scale
        if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) isDragging.current = true
        const patch: Partial<BlocoCert> = {
            y: Math.max(0, Math.min(590, Math.round(dragRef.current.startBlocoY + deltaY))),
        }
        if (dragRef.current.alignment === 'esquerda') {
            patch.x = Math.max(0, Math.min(800, Math.round(dragRef.current.startBlocoX + deltaX)))
        } else if (dragRef.current.alignment === 'direita') {
            patch.x = Math.max(0, Math.min(800, Math.round(dragRef.current.startBlocoX - deltaX)))
        }
        onUpdateBloco(dragRef.current.id, patch)
    }

    const handleContainerMouseUp = () => {
        if (!isDragging.current && !dragRef.current) onSelectBloco?.(null)
        dragRef.current = null
        isDragging.current = false
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-3">
            {!hideLabels && (
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preview em Tempo Real</p>
                    <div className="flex items-center gap-2">
                        {usaBlocos && (
                            <span className="text-[9px] font-black text-[#2D9E6B] bg-green-50 px-2 py-1 rounded-full border border-green-100">Modo Blocos</span>
                        )}
                        <span className="text-[9px] font-bold text-gray-300 bg-gray-100 px-2 py-1 rounded-full">Dados de exemplo</span>
                    </div>
                </div>
            )}

            <div
                ref={containerRef}
                className="relative rounded-xl overflow-hidden shadow-2xl shadow-black/20 border border-gray-200"
                style={{ width: outerW, height: outerH, userSelect: 'none' }}
                onMouseMove={editable ? handleContainerMouseMove : undefined}
                onMouseUp={editable ? handleContainerMouseUp : undefined}
                onMouseLeave={editable ? () => { dragRef.current = null; isDragging.current = false; } : undefined}
            >
                <div style={{
                    width: W, height: H,
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    position: 'absolute', top: 0, left: 0,
                    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                    backgroundColor: '#fff', overflow: 'hidden',
                }}>
                    {/* Fundo */}
                    {certData.fundo_url && (
                        <img src={certData.fundo_url} alt=""
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                    )}

                    {/* Borda */}
                    {certData.mostrar_borda && (
                        <>
                            <div style={{ position: 'absolute', inset: 20, border: `4px solid ${primary}`, pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', inset: 30, border: `1px solid ${secondary}`, pointerEvents: 'none' }} />
                        </>
                    )}

                    {/* Logo — topo esquerdo */}
                    {certData.logo_url && (
                        <img src={certData.logo_url} alt="Logo"
                            style={{ position: 'absolute', top: 28, left: 60, height: 60, objectFit: 'contain', pointerEvents: 'none' }} />
                    )}

                    {usaBlocos ? (
                        blocos!.map(bloco => {
                            const texto = resolveTokens(bloco.texto, previewTokens)
                            const isSel = editable && selectedId === bloco.id
                            return (
                                <div
                                    key={bloco.id}
                                    onMouseDown={editable ? (e) => handleBlocoMouseDown(e, bloco) : undefined}
                                    style={{
                                        position: 'absolute',
                                        top: bloco.y,
                                        ...(bloco.alinhamento === 'centro'
                                            ? { left: 0, right: 0, textAlign: 'center' as const }
                                            : bloco.alinhamento === 'direita'
                                            ? { right: bloco.x, textAlign: 'right' as const }
                                            : { left: bloco.x, textAlign: 'left' as const }),
                                        fontSize: bloco.tam,
                                        fontFamily: bloco.fonte ? FONTES_CERT.find(f => f.value === bloco.fonte)?.cssFamily : undefined,
                                        textTransform: bloco.maiuscula !== false ? 'uppercase' : 'capitalize',
                                        fontWeight: bloco.negrito ? 900 : 400,
                                        fontStyle: bloco.italico ? 'italic' : 'normal',
                                        color: bloco.cor || textClr,
                                        lineHeight: 1.4,
                                        whiteSpace: 'pre-wrap',
                                        pointerEvents: editable ? 'auto' : 'none',
                                        cursor: editable ? 'grab' : 'default',
                                        outline: isSel ? '2px dashed #2D9E6B' : 'none',
                                        outlineOffset: 4,
                                        padding: isSel ? '0 4px' : undefined,
                                        boxSizing: 'border-box' as const,
                                    }}
                                >
                                    {texto}
                                </div>
                            )
                        })
                    ) : (
                        <>
                            {/* Instituição — topo (espelha posição do PDF: height-80) */}
                            {certData.mostrar_instituicao && (
                                <div style={{
                                    position: 'absolute',
                                    top: 28,
                                    left: certData.logo_url ? 140 : 60,
                                    right: 60,
                                    textAlign: certData.logo_url ? 'right' as const : textAlign,
                                    fontSize: certData.tam_instituicao,
                                    fontWeight: 900,
                                    color: primary,
                                    letterSpacing: 3,
                                    textTransform: 'uppercase' as const,
                                    lineHeight: 1.2,
                                }}>
                                    {nomeInst}
                                </div>
                            )}

                            {/* Área central de conteúdo (espelha height-160 a height-330) */}
                            <div style={{
                                position: 'absolute',
                                top: 100 - posYConteudo,
                                left: 60 + posXConteudo,
                                right: 60 - posXConteudo,
                                bottom: 130 + posYConteudo,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems,
                                textAlign,
                                justifyContent: 'center',
                                gap: 0,
                            }}>
                                {/* Título principal */}
                                <div style={{
                                    fontSize: certData.tam_titulo,
                                    fontWeight: 900,
                                    color: primary,
                                    letterSpacing: 1,
                                    marginBottom: 20,
                                }}>
                                    {titulo}
                                </div>

                                {/* Subtítulo (texto_pre) — estilo do PDF: menor, cinza, uppercase */}
                                <div style={{
                                    fontSize: 14,
                                    color: '#888',
                                    letterSpacing: 1,
                                    textTransform: 'uppercase' as const,
                                    marginBottom: 16,
                                }}>
                                    {subtitulo}
                                </div>

                                {/* Nome do aluno */}
                                <div style={{
                                    fontSize: certData.tam_nome,
                                    fontWeight: 900,
                                    color: nameClr,
                                    marginBottom: 20,
                                }}>
                                    {EXEMPLO_ALUNO}
                                </div>

                                {/* Corpo com texto rico — espelha drawRichText do PDF */}
                                <div style={{
                                    fontSize: certData.tam_texto,
                                    color: textClr,
                                    lineHeight: 1.5,
                                    maxWidth: '90%',
                                }}>
                                    <RichText text={bodyText} style={{}} />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Data de emissão — só no modo legado */}
                    {!usaBlocos && (
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
                    )}

                    {/* Assinatura mediador */}
                    {certData.nome_mediador && (
                        <>
                            {certData.assinatura_mediador_url && (
                                <img src={certData.assinatura_mediador_url} alt="Assinatura mediador"
                                    style={{
                                        position: 'absolute', top: 448, left: 80, width: 200,
                                        height: 36, objectFit: 'contain',
                                        transform: `translate(${offXMed}px, ${-offYResp}px)`,
                                        pointerEvents: 'none',
                                    }} />
                            )}
                            <div style={{
                                position: 'absolute', top: 490, left: 80, width: 200,
                                textAlign: 'center',
                                transform: `translate(${offXMed}px, ${-offYResp}px)`,
                            }}>
                                <div style={{ borderTop: `1px solid ${primary}`, paddingTop: 6 }}>
                                    <div style={{ fontSize: 11, fontStyle: 'italic', color: textClr }}>{certData.nome_mediador}</div>
                                    {certData.cargo_mediador && <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{certData.cargo_mediador}</div>}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Assinatura responsável */}
                    <>
                        {certData.assinatura_url && (
                            <img src={certData.assinatura_url} alt="Assinatura"
                                style={{
                                    position: 'absolute', top: 448, right: 80, width: 200,
                                    height: 36, objectFit: 'contain',
                                    transform: `translate(${-offXResp}px, ${-offYResp}px)`,
                                    pointerEvents: 'none',
                                }} />
                        )}
                        <div style={{
                            position: 'absolute', top: 490, right: 80, width: 200,
                            textAlign: 'center',
                            transform: `translate(${-offXResp}px, ${-offYResp}px)`,
                        }}>
                            <div style={{ borderTop: `1px solid ${primary}`, paddingTop: 6 }}>
                                <div style={{ fontSize: 11, fontStyle: 'italic', color: textClr }}>{responsavel}</div>
                                {certData.cargo_responsavel && <div style={{ fontSize: 9, color: '#999', marginTop: 2 }}>{certData.cargo_responsavel}</div>}
                            </div>
                        </div>
                    </>

                    {/* Código de autenticação — só no modo legado */}
                    {!usaBlocos && certData.mostrar_codigo && (
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
