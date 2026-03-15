import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface BlocoCert {
    id: string
    texto: string
    x: number       // distância da esquerda (0–841); ignorado quando alinhamento='centro'
    y: number       // distância do topo (0–595)
    tam: number     // tamanho da fonte
    negrito: boolean
    italico: boolean
    cor: string     // hex, ex: '#1A3C4A'
    alinhamento: 'esquerda' | 'centro' | 'direita'
}

interface CertConfig {
    titulo?: string
    texto_pre?: string
    texto_pos?: string
    nome_responsavel?: string
    cargo_responsavel?: string
    assinatura_url?: string
    site_validacao?: string
    cor_primaria?: string
    cor_secundaria?: string
    fundo_url?: string
    nome_instituicao?: string
    // Visibilidade
    mostrar_borda?: boolean
    mostrar_codigo?: boolean
    mostrar_carga_horaria?: boolean
    mostrar_instituicao?: boolean
    // Alinhamento global
    alinhamento?: 'esquerda' | 'centro' | 'direita'
    // Tamanhos de fonte
    tam_titulo?: number
    tam_nome?: number
    tam_texto?: number
    tam_instituicao?: number
    // Cores individuais
    cor_texto?: string
    cor_nome?: string
    // Mídia
    logo_url?: string
    // Posição (vertical: positivo = sobe; horizontal: positivo = direita)
    pos_y_conteudo?: number
    pos_y_rodape?: number
    pos_x_conteudo?: number
    pos_x_rodape?: number
    // Texto complementar livre (por curso)
    texto_complementar?: string
    // Mediador(a)
    nome_mediador?: string
    cargo_mediador?: string
    assinatura_mediador_url?: string
    off_x_mediador?: number
    off_y_mediador?: number
    off_x_responsavel?: number
    off_y_responsavel?: number
    // Blocos de texto posicionáveis com tokens
    blocos?: BlocoCert[]
    // Período (para token {{periodo}})
    periodo?: string
    // Tipo da turma (para token {{tipo_turma}})
    tipo_turma?: string
}

function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    return rgb(r, g, b)
}

function calcX(text: string, font: any, size: number, align: string, width: number, margin = 60): number {
    const tw = font.widthOfTextAtSize(text, size)
    if (align === 'esquerda') return margin
    if (align === 'direita') return width - margin - tw
    return width / 2 - tw / 2
}

function resolveTokens(texto: string, vals: Record<string, string>): string {
    return texto.replace(/\{\{(\w+)\}\}/g, (_, k) => vals[k] ?? '')
}

export class PDFService {
    static async drawRichText(
        page: any,
        text: string,
        x: number,
        y: number,
        width: number,
        options: {
            fontNormal: any,
            fontBold: any,
            size: number,
            color: any,
            align: 'esquerda' | 'centro' | 'direita',
            lineHeight?: number
        }
    ) {
        const { fontNormal, fontBold, size, color, align, lineHeight = size * 1.4 } = options

        // Split by ** to identify bold segments
        const parts = text.split(/(\*\*.*?\*\*)/g)
        const segments: { text: string, font: any }[] = []

        parts.forEach(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                segments.push({ text: part.slice(2, -2), font: fontBold })
            } else if (part) {
                segments.push({ text: part, font: fontNormal })
            }
        })

        // Simple line wrapping
        const lines: { segments: { text: string, font: any }[] }[] = [{ segments: [] }]
        let currentWidth = 0
        const maxWidth = width - 120 // Margin

        segments.forEach(segment => {
            const words = segment.text.split(/(\s+)/)
            words.forEach(word => {
                const wordWidth = segment.font.widthOfTextAtSize(word, size)
                if (currentWidth + wordWidth > maxWidth && word.trim()) {
                    lines.push({ segments: [] })
                    currentWidth = 0
                }
                lines[lines.length - 1].segments.push({ text: word, font: segment.font })
                currentWidth += wordWidth
            })
        })

        lines.forEach((line, i) => {
            let totalLineWidth = 0
            line.segments.forEach(seg => {
                totalLineWidth += seg.font.widthOfTextAtSize(seg.text, size)
            })

            let startX = x
            if (align === 'centro') startX = (page.getSize().width - totalLineWidth) / 2
            else if (align === 'direita') startX = page.getSize().width - x - totalLineWidth

            let tx = startX
            line.segments.forEach(seg => {
                page.drawText(seg.text, { x: tx, y: y - (i * lineHeight), size, font: seg.font, color })
                tx += seg.font.widthOfTextAtSize(seg.text, size)
            })
        })

        return lines.length * lineHeight
    }

    static async generateCertificate(
        nomeCidadao: string,
        tituloEntidade: string,
        tipo: 'certificado' | 'comprovante',
        dataEmissao: Date,
        cargaHoraria: string | number,
        nomeInstituicao: string,
        codigoValidacao: string,
        config: CertConfig = {}
    ): Promise<Uint8Array> {
        // Derivar todas as opções de configuração
        const align = config.alinhamento || 'centro'
        const showBorda = config.mostrar_borda !== false
        const showCodigo = config.mostrar_codigo !== false
        const showInstituicao = config.mostrar_instituicao !== false
        const tamTitulo = config.tam_titulo || 36
        const tamNome = config.tam_nome || 32
        const tamTexto = config.tam_texto || 18
        const tamInstituicao = config.tam_instituicao || 16
        const posYConteudo = config.pos_y_conteudo || 0
        const posYRodape = config.pos_y_rodape || 0
        const posXConteudo = config.pos_x_conteudo || 0
        const posXRodape = config.pos_x_rodape || 0
        const offXMed = config.off_x_mediador || 0
        const offXResp = config.off_x_responsavel || 0
        const offYResp = config.off_y_responsavel || 0

        // Criar um novo documento PDF
        const pdfDoc = await PDFDocument.create()

        // Adicionar uma página no formato paisagem (A4)
        const page = pdfDoc.addPage([841.89, 595.28])
        const { width, height } = page.getSize()

        // Carregar fontes padronizadas
        const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const fontText = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
        const fontBoldItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)

        // Cores
        const primaryColor = config.cor_primaria ? hexToRgb(config.cor_primaria) : rgb(0.10, 0.24, 0.29)
        const highlightColor = config.cor_secundaria ? hexToRgb(config.cor_secundaria) : rgb(0.18, 0.62, 0.42)
        const textColor = config.cor_texto ? hexToRgb(config.cor_texto) : rgb(0.3, 0.3, 0.3)
        const nameColor = config.cor_nome ? hexToRgb(config.cor_nome) : highlightColor

        // Fundo
        if (config.fundo_url) {
            try {
                const imgRes = await fetch(config.fundo_url)
                const imgBytes = await imgRes.arrayBuffer()
                const isJpg = config.fundo_url.toLowerCase().match(/\.(jpg|jpeg)/)
                const bgImage = isJpg ? await pdfDoc.embedJpg(imgBytes) : await pdfDoc.embedPng(imgBytes)
                page.drawImage(bgImage, { x: 0, y: 0, width, height })
            } catch { }
        }

        // Logo
        if (config.logo_url) {
            try {
                const logoRes = await fetch(config.logo_url)
                const logoBytes = await logoRes.arrayBuffer()
                const isJpg = config.logo_url.toLowerCase().match(/\.(jpg|jpeg)/)
                const logoImg = isJpg ? await pdfDoc.embedJpg(logoBytes) : await pdfDoc.embedPng(logoBytes)
                const logoH = 60
                const logoW = logoImg.width * (logoH / logoImg.height)
                page.drawImage(logoImg, { x: 60, y: height - 80, width: logoW, height: logoH })
            } catch (e) {
                console.warn('Logo do certificado não carregou:', e)
            }
        }

        // Borda
        if (showBorda) {
            page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: primaryColor, borderWidth: 4 })
            page.drawRectangle({ x: 30, y: 30, width: width - 60, height: height - 60, borderColor: highlightColor, borderWidth: 1 })
        }

        // Blocos de texto posicionáveis ou layout padrão
        if (config.blocos && config.blocos.length > 0) {
            const tokenVals: Record<string, string> = {
                nome: nomeCidadao.toUpperCase(),
                curso: tituloEntidade,
                carga_horaria: String(cargaHoraria),
                data_emissao: dataEmissao.toLocaleDateString('pt-BR'),
                instituicao: config.nome_instituicao || nomeInstituicao,
                codigo: codigoValidacao,
                periodo: config.periodo || '',
                tipo_turma: config.tipo_turma || '',
            }
            for (const bloco of config.blocos) {
                const resolvedText = resolveTokens(bloco.texto, tokenVals)
                const font = bloco.negrito && bloco.italico ? fontBoldItalic : bloco.negrito ? fontTitle : bloco.italico ? fontItalic : fontText
                const color = bloco.cor ? hexToRgb(bloco.cor) : textColor
                const lines = resolvedText.split('\n')
                const lineHeight = bloco.tam * 1.4
                lines.forEach((line, i) => {
                    if (!line.trim()) return
                    const tw = font.widthOfTextAtSize(line, bloco.tam)
                    const px = (bloco.alinhamento === 'centro') ? width / 2 - tw / 2 : (bloco.alinhamento === 'direita') ? width - bloco.x - tw : bloco.x
                    const py = height - bloco.y - bloco.tam - (i * lineHeight)
                    if (py > 0 && py < height) page.drawText(line, { x: px, y: py, size: bloco.tam, font, color })
                })
            }
        } else {
            // Instituição
            if (showInstituicao) {
                const instText = (config.nome_instituicao || nomeInstituicao).toUpperCase()
                page.drawText(instText, { x: calcX(instText, fontTitle, tamInstituicao, align, width), y: height - 80, size: tamInstituicao, font: fontTitle, color: primaryColor })
            }

            // Título Principal
            const tituloDoc = config.titulo || (tipo === 'certificado' ? 'CERTIFICADO DE CONCLUSÃO' : 'COMPROVANTE DE PARTICIPAÇÃO')
            page.drawText(tituloDoc, {
                x: calcX(tituloDoc, fontTitle, tamTitulo, align, width) + posXConteudo,
                y: height - 160 + posYConteudo,
                size: tamTitulo,
                font: fontTitle,
                color: primaryColor,
            })

            // Subtítulo
            const subtitle = config.texto_pre || (tipo === 'certificado' ? 'ESTE CERTIFICADO COMPROVA QUE' : 'Comprovamos para os devidos fins que')
            page.drawText(subtitle, {
                x: calcX(subtitle, fontText, 14, align, width) + posXConteudo,
                y: height - 220 + posYConteudo,
                size: 14,
                font: fontText,
                color: rgb(0.4, 0.4, 0.4),
            })

            // Nome do Participante
            const nomeUpper = nomeCidadao.toUpperCase()
            page.drawText(nomeUpper, {
                x: calcX(nomeUpper, fontTitle, tamNome, align, width) + posXConteudo,
                y: height - 280 + posYConteudo,
                size: tamNome,
                font: fontTitle,
                color: nameColor,
            })

            // Bloco de Texto Principal (com bolding dinâmico)
            const curso = tituloEntidade.toUpperCase()
            const periodo = config.periodo || ''
            const carga = String(cargaHoraria)

            const orientedText = config.texto_pos
                ? resolveTokens(config.texto_pos, { curso, periodo, carga_horaria: carga, nome: nomeCidadao, instituicao: config.nome_instituicao || nomeInstituicao })
                : `CONCLUIU COM ÊXITO O **CURSO DE ${curso}**. OFERECIDO NO **PERIODO DE ${periodo}**. COM **CARGA HORÁRIA DE ${carga}H**.`

            await this.drawRichText(page, orientedText, 60 + posXConteudo, height - 330 + posYConteudo, width, {
                fontNormal: fontText,
                fontBold: fontTitle,
                size: tamTexto,
                color: textColor,
                align: 'centro'
            })
        }

        // Rodapé e Assinaturas
        const hasMediador = !!(config.nome_mediador)
        const baseY = posYRodape
        const dateStr = `Emitido em ${dataEmissao.toLocaleDateString('pt-BR')}`
        page.drawText(dateStr, { x: hasMediador ? width / 2 - fontText.widthOfTextAtSize(dateStr, 12) / 2 : 100 + posXRodape, y: hasMediador ? 50 + baseY : 100 + baseY, size: hasMediador ? 12 : 14, font: fontText, color: textColor })

        // Mediador
        if (hasMediador) {
            const medX = 80 + offXMed
            const medY = offYResp
            const medBlockW = 200
            if (config.assinatura_mediador_url) {
                try {
                    const mRes = await fetch(config.assinatura_mediador_url)
                    const mBytes = await mRes.arrayBuffer()
                    const mImg = config.assinatura_mediador_url.toLowerCase().match(/\.(jpg|jpeg)/) ? await pdfDoc.embedJpg(mBytes) : await pdfDoc.embedPng(mBytes)
                    const mH = 40, mW = mImg.width * (mH / mImg.height)
                    page.drawImage(mImg, { x: medX + (medBlockW - mW) / 2, y: 90 + medY, width: mW, height: mH })
                } catch { }
            }
            page.drawLine({ start: { x: medX, y: 80 + medY }, end: { x: medX + medBlockW, y: 80 + medY }, thickness: 1, color: primaryColor })
            const medNomeW = fontItalic.widthOfTextAtSize(config.nome_mediador!, 12)
            page.drawText(config.nome_mediador!, { x: medX + (medBlockW - medNomeW) / 2, y: 64 + medY, size: 12, font: fontItalic, color: textColor })
            if (config.cargo_mediador) {
                const medCargoW = fontText.widthOfTextAtSize(config.cargo_mediador, 10)
                page.drawText(config.cargo_mediador, { x: medX + (medBlockW - medCargoW) / 2, y: 50 + medY, size: 10, font: fontText, color: rgb(0.5, 0.5, 0.5) })
            }
        }

        // Responsável
        // Base: width-280 espelha o CSS "right: 80, minWidth: 200" (841.89-80-200=561.89)
        // Sinal negativo para off_x espelha o CSS translateX(-offXResp)
        const respX = width - 280 - offXResp
        const respY = offYResp
        if (config.assinatura_url) {
            try {
                const sigRes = await fetch(config.assinatura_url)
                const sigBytes = await sigRes.arrayBuffer()
                const sigImg = config.assinatura_url.toLowerCase().match(/\.(jpg|jpeg)/) ? await pdfDoc.embedJpg(sigBytes) : await pdfDoc.embedPng(sigBytes)
                const sigH = 40, sigW = sigImg.width * (sigH / sigImg.height)
                page.drawImage(sigImg, { x: respX + (200 - sigW) / 2, y: 90 + respY, width: sigW, height: sigH })
            } catch { }
        }
        page.drawLine({ start: { x: respX, y: 80 + respY }, end: { x: respX + 200, y: 80 + respY }, thickness: 1, color: primaryColor })
        const nResp = config.nome_responsavel || 'Assinatura Eletrônica'
        const nRespW = fontItalic.widthOfTextAtSize(nResp, 12)
        page.drawText(nResp, { x: respX + (200 - nRespW) / 2, y: 64 + respY, size: 12, font: fontItalic, color: textColor })
        if (config.cargo_responsavel) {
            const cargoW = fontText.widthOfTextAtSize(config.cargo_responsavel, 10)
            page.drawText(config.cargo_responsavel, { x: respX + (200 - cargoW) / 2, y: 50 + respY, size: 10, font: fontText, color: rgb(0.5, 0.5, 0.5) })
        }

        // Código de Validação
        if (showCodigo) {
            const authStr = `Código: ${codigoValidacao} | Validar em: ${config.site_validacao || 'nexori.com.br'}/validar/${codigoValidacao}`
            page.drawText(authStr, {
                x: width / 2 - (fontText.widthOfTextAtSize(authStr, 8) / 2),
                y: 25,
                size: 8,
                font: fontText,
                color: rgb(0.5, 0.5, 0.5),
            })
        }

        const pdfBytes = await pdfDoc.save()
        return pdfBytes
    }
}
