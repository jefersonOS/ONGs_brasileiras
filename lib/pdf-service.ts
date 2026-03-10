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
}

function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    return rgb(r, g, b)
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
        const showCodigo = config.mostrar_codigo !== false
        const tamTitulo = config.tam_titulo || 48
        const tamNome = config.tam_nome || 42
        const tamTexto = config.tam_texto || 16
        const posYConteudo = config.pos_y_conteudo || 0
        const posYRodape = config.pos_y_rodape || 0
        const posXConteudo = config.pos_x_conteudo || 0
        const offXMed = config.off_x_mediador || 0
        const offXResp = config.off_x_responsavel || 0

        // Criar um novo documento PDF
        const pdfDoc = await PDFDocument.create()

        // Adicionar uma página no formato paisagem (A4)
        const page = pdfDoc.addPage([841.89, 595.28])
        const { width, height } = page.getSize()

        // Carregar fontes padronizadas
        const fontTitle = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
        const fontText = await pdfDoc.embedFont(StandardFonts.Helvetica)
        const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

        // Cores
        const primaryColor = config.cor_primaria ? hexToRgb(config.cor_primaria) : rgb(0.10, 0.24, 0.45) // Ajustado para Amigos do Bem
        const pinkSecondary = rgb(0.85, 0.35, 0.8) // Rosa Amigos do Bem
        const textColor = config.cor_texto ? hexToRgb(config.cor_texto) : rgb(0.1, 0.2, 0.3)
        const nameColor = config.cor_nome ? hexToRgb(config.cor_nome) : rgb(0.10, 0.24, 0.45)

        // 1. Faixas Decorativas (Cantos) - Usando retângulos e linhas para simular polígonos
        // Canto Superior Esquerdo
        page.drawRectangle({
            x: 0,
            y: height - 150,
            width: 150,
            height: 150,
            color: pinkSecondary,
            opacity: 0.8
        })
        page.drawLine({ start: { x: 160, y: height }, end: { x: 0, y: height - 160 }, thickness: 8, color: pinkSecondary, opacity: 0.5 })

        // Canto Inferior Direito
        page.drawRectangle({
            x: width - 150,
            y: 0,
            width: 150,
            height: 150,
            color: pinkSecondary,
            opacity: 0.8
        })
        page.drawLine({ start: { x: width - 160, y: 0 }, end: { x: width, y: 160 }, thickness: 8, color: pinkSecondary, opacity: 0.5 })

        // 2. Logo Centralizado
        if (config.logo_url) {
            try {
                const logoRes = await fetch(config.logo_url)
                const logoBytes = await logoRes.arrayBuffer()
                const isJpg = config.logo_url.toLowerCase().match(/\.(jpg|jpeg)/)
                const logoImg = isJpg ? await pdfDoc.embedJpg(logoBytes) : await pdfDoc.embedPng(logoBytes)
                const logoH = 80
                const logoW = logoImg.width * (logoH / logoImg.height)
                page.drawImage(logoImg, { x: width / 2 - logoW / 2, y: height - 110, width: logoW, height: logoH })
            } catch (e) {
                console.warn('Logo do certificado não carregou:', e)
            }
        }

        // 3. Título Principal
        const tituloDoc = config.titulo || 'CERTIFICADO'
        const twTitle = fontTitle.widthOfTextAtSize(tituloDoc, tamTitulo)
        page.drawText(tituloDoc, {
            x: width / 2 - twTitle / 2 + posXConteudo,
            y: height - 180 + posYConteudo,
            size: tamTitulo,
            font: fontTitle,
            color: primaryColor,
        })

        // Subtítulo
        const subtitle = 'ESTE CERTIFICADO COMPROVA QUE'
        const twSub = fontText.widthOfTextAtSize(subtitle, 14)
        page.drawText(subtitle, {
            x: width / 2 - twSub / 2 + posXConteudo,
            y: height - 220 + posYConteudo,
            size: 14,
            font: fontText,
            color: rgb(0.4, 0.4, 0.4),
        })

        // 4. Nome do Participante (Destaque Itálico/Script-like)
        const nomeUpper = nomeCidadao
        const twNome = fontItalic.widthOfTextAtSize(nomeUpper, tamNome)
        page.drawText(nomeUpper, {
            x: width / 2 - twNome / 2 + posXConteudo,
            y: height - 290 + posYConteudo,
            size: tamNome,
            font: fontItalic,
            color: nameColor,
        })

        // 5. Bloco de Texto Principal (com bolding dinâmico)
        const curso = tituloEntidade.toUpperCase()
        const periodo = config.periodo || ''
        const carga = String(cargaHoraria)

        const textoPrincipal = `CONCLUIU COM ÊXITO O **CURSO DE ${curso}**. OFERECIDO NO **PERIODO DE ${periodo}**. PELA ASSOCIAÇÃO AMIGOS DO BEM, EM PARCERIA COM O GOVERNO DO ESTADO ATRAVÉS DA SECRETARIA ESTADUAL DE TURISMO E EMPREENDEDORISMO, COM **CARGA HORÁRIA DE ${carga}H**.`

        await this.drawRichText(page, textoPrincipal, 60 + posXConteudo, height - 340 + posYConteudo, width, {
            fontNormal: fontText,
            fontBold: fontTitle,
            size: tamTexto,
            color: textColor,
            align: 'centro'
        })

        // 6. Rodapé e Assinaturas
        const baseY = 80 + posYRodape

        // Linhas de Assinatura
        // Mediadora
        const lineW = 220
        page.drawLine({
            start: { x: 100 + offXMed, y: baseY + 40 },
            end: { x: 100 + lineW + offXMed, y: baseY + 40 },
            thickness: 1,
            color: pinkSecondary
        })
        const labelMed = config.cargo_mediador || 'Mediadora'
        const twLMed = fontText.widthOfTextAtSize(labelMed, 12)
        page.drawText(labelMed, { x: 100 + lineW / 2 - twLMed / 2 + offXMed, y: baseY + 20, size: 12, font: fontText, color: textColor })

        if (config.nome_mediador) {
            const twNMed = fontItalic.widthOfTextAtSize(config.nome_mediador, 14)
            page.drawText(config.nome_mediador, { x: 100 + lineW / 2 - twNMed / 2 + offXMed, y: baseY + 45, size: 14, font: fontItalic, color: textColor })
        }

        // Presidente
        page.drawLine({
            start: { x: width - 100 - lineW + offXResp, y: baseY + 40 },
            end: { x: width - 100 + offXResp, y: baseY + 40 },
            thickness: 1,
            color: pinkSecondary
        })
        const labelPres = config.cargo_responsavel || 'Presidente'
        const twLPres = fontText.widthOfTextAtSize(labelPres, 12)
        page.drawText(labelPres, { x: width - 100 - lineW / 2 - twLPres / 2 + offXResp, y: baseY + 20, size: 12, font: fontText, color: textColor })

        if (config.nome_responsavel) {
            const twNResp = fontItalic.widthOfTextAtSize(config.nome_responsavel, 14)
            page.drawText(config.nome_responsavel, { x: width - 100 - lineW / 2 - twNResp / 2 + offXResp, y: baseY + 45, size: 14, font: fontItalic, color: textColor })
        }

        // Assinaturas (Imagens)
        if (config.assinatura_mediador_url) {
            try {
                const sigRes = await fetch(config.assinatura_mediador_url)
                const sigBytes = await sigRes.arrayBuffer()
                const sigImg = await pdfDoc.embedPng(sigBytes)
                page.drawImage(sigImg, { x: 100 + lineW / 2 - 40 + offXMed, y: baseY + 45, width: 80, height: 40 })
            } catch (_e) { }
        }
        if (config.assinatura_url) {
            try {
                const sigRes = await fetch(config.assinatura_url)
                const sigBytes = await sigRes.arrayBuffer()
                const sigImg = await pdfDoc.embedPng(sigBytes)
                page.drawImage(sigImg, { x: width - 100 - lineW / 2 - 40 + offXResp, y: baseY + 45, width: 80, height: 40 })
            } catch (_e) { }
        }

        // 7. Código de Validação (Discreto no fundo)
        if (showCodigo) {
            const authStr = `Código de Autenticação: ${codigoValidacao} | Verificável em: ${config.site_validacao || 'nexori.com.br'}/validar/${codigoValidacao}`
            page.drawText(authStr, {
                x: width / 2 - (fontText.widthOfTextAtSize(authStr, 8) / 2),
                y: 15,
                size: 8,
                font: fontText,
                color: rgb(0.6, 0.6, 0.6),
            })
        }

        const pdfBytes = await pdfDoc.save()
        return pdfBytes
    }
}
