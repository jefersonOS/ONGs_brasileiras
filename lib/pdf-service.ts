import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

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
    // Posição vertical (positivo = sobe, negativo = desce)
    pos_y_conteudo?: number
    pos_y_rodape?: number
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

export class PDFService {
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
        const showCarga = config.mostrar_carga_horaria !== false
        const showInstituicao = config.mostrar_instituicao !== false
        const tamTitulo = config.tam_titulo || 36
        const tamNome = config.tam_nome || 32
        const tamTexto = config.tam_texto || 18
        const tamInstituicao = config.tam_instituicao || 16
        const posYConteudo = config.pos_y_conteudo || 0
        const posYRodape = config.pos_y_rodape || 0

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
        const primaryColor = config.cor_primaria ? hexToRgb(config.cor_primaria) : rgb(0.10, 0.24, 0.29)
        const highlightColor = config.cor_secundaria ? hexToRgb(config.cor_secundaria) : rgb(0.18, 0.62, 0.42)
        const textColor = config.cor_texto ? hexToRgb(config.cor_texto) : rgb(0.3, 0.3, 0.3)
        const nameColor = config.cor_nome ? hexToRgb(config.cor_nome) : highlightColor

        // Imagem de fundo (template da ONG)
        if (config.fundo_url) {
            try {
                const imgRes = await fetch(config.fundo_url)
                const imgBytes = await imgRes.arrayBuffer()
                const isJpg = config.fundo_url.toLowerCase().match(/\.(jpg|jpeg)/)
                const bgImage = isJpg
                    ? await pdfDoc.embedJpg(imgBytes)
                    : await pdfDoc.embedPng(imgBytes)
                page.drawImage(bgImage, { x: 0, y: 0, width, height })
            } catch (e) {
                console.warn('Não foi possível carregar imagem de fundo do certificado:', e)
            }
        }

        // Logo da instituição (canto superior esquerdo)
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

        // Bordas e Design Base
        if (showBorda) {
            page.drawRectangle({
                x: 20,
                y: 20,
                width: width - 40,
                height: height - 40,
                borderColor: primaryColor,
                borderWidth: 4,
            })

            page.drawRectangle({
                x: 30,
                y: 30,
                width: width - 60,
                height: height - 60,
                borderColor: highlightColor,
                borderWidth: 1,
            })
        }

        // Cabeçalho / Instituição
        if (showInstituicao) {
            const nomeInstit = config.nome_instituicao || nomeInstituicao
            const instText = nomeInstit.toUpperCase()
            page.drawText(instText, {
                x: calcX(instText, fontTitle, tamInstituicao, align, width),
                y: height - 80,
                size: tamInstituicao,
                font: fontTitle,
                color: primaryColor,
            })
        }

        // Título Principal
        const tituloDoc = config.titulo || (tipo === 'certificado' ? 'CERTIFICADO DE CONCLUSÃO' : 'COMPROVANTE DE PARTICIPAÇÃO')
        page.drawText(tituloDoc, {
            x: calcX(tituloDoc, fontTitle, tamTitulo, align, width),
            y: height - 160 + posYConteudo,
            size: tamTitulo,
            font: fontTitle,
            color: primaryColor,
        })

        // Corpo do Texto
        const textPre = config.texto_pre || (tipo === 'certificado'
            ? 'Certificamos que'
            : 'Comprovamos para os devidos fins que')

        page.drawText(textPre, {
            x: calcX(textPre, fontText, tamTexto, align, width),
            y: height - 230 + posYConteudo,
            size: tamTexto,
            font: fontText,
            color: textColor,
        })

        // Nome do Participante (Destaque)
        const nomeUpper = nomeCidadao.toUpperCase()
        page.drawText(nomeUpper, {
            x: calcX(nomeUpper, fontTitle, tamNome, align, width),
            y: height - 280 + posYConteudo,
            size: tamNome,
            font: fontTitle,
            color: nameColor,
        })

        // Continuação do Texto
        const textPos = config.texto_pos || (tipo === 'certificado'
            ? `concluiu com êxito o curso de`
            : `esteve presente na atividade de`)

        page.drawText(textPos, {
            x: calcX(textPos, fontText, tamTexto, align, width),
            y: height - 330 + posYConteudo,
            size: tamTexto,
            font: fontText,
            color: textColor,
        })

        // Nome do Curso/Atividade
        const cursoText = `"${tituloEntidade}"`
        page.drawText(cursoText, {
            x: calcX(cursoText, fontTitle, 24, align, width),
            y: height - 370 + posYConteudo,
            size: 24,
            font: fontTitle,
            color: primaryColor,
        })

        // Carga Horária (se houver)
        if (showCarga && cargaHoraria && cargaHoraria !== '0') {
            const extraText = `com carga horária total de ${cargaHoraria} horas.`
            page.drawText(extraText, {
                x: calcX(extraText, fontText, 16, align, width),
                y: height - 410 + posYConteudo,
                size: 16,
                font: fontText,
                color: textColor,
            })
        }

        // Rodapé Data e Assinatura
        const dateStr = `Emitido em ${dataEmissao.toLocaleDateString('pt-BR')}`
        page.drawText(dateStr, {
            x: 100,
            y: 100 + posYRodape,
            size: 14,
            font: fontText,
            color: textColor,
        })

        // Imagem da assinatura (acima da linha)
        if (config.assinatura_url) {
            try {
                const sigRes = await fetch(config.assinatura_url)
                const sigBytes = await sigRes.arrayBuffer()
                const isJpg = config.assinatura_url.toLowerCase().match(/\.(jpg|jpeg)/)
                const sigImg = isJpg ? await pdfDoc.embedJpg(sigBytes) : await pdfDoc.embedPng(sigBytes)
                const sigH = 40
                const sigW = sigImg.width * (sigH / sigImg.height)
                page.drawImage(sigImg, { x: width - 300 + (200 - sigW) / 2, y: 125 + posYRodape, width: sigW, height: sigH })
            } catch (e) {
                console.warn('Assinatura do certificado não carregou:', e)
            }
        }

        page.drawLine({
            start: { x: width - 300, y: 120 + posYRodape },
            end: { x: width - 100, y: 120 + posYRodape },
            thickness: 1,
            color: primaryColor,
        })

        const nomeResponsavel = config.nome_responsavel || 'Assinatura Eletrônica / Coordenação'
        const nomeResponsavelWidth = fontItalic.widthOfTextAtSize(nomeResponsavel, 12)
        const sigX = width - 300 + ((200 - nomeResponsavelWidth) / 2)

        page.drawText(nomeResponsavel, {
            x: sigX,
            y: 100 + posYRodape,
            size: 12,
            font: fontItalic,
            color: textColor,
        })

        if (config.cargo_responsavel) {
            const cargoWidth = fontText.widthOfTextAtSize(config.cargo_responsavel, 10)
            const cargoX = width - 300 + ((200 - cargoWidth) / 2)
            page.drawText(config.cargo_responsavel, {
                x: cargoX,
                y: 84 + posYRodape,
                size: 10,
                font: fontText,
                color: rgb(0.5, 0.5, 0.5),
            })
        }

        // Código de Validação
        if (showCodigo) {
            const authStr = `Código de Autenticação: ${codigoValidacao}`
            page.drawText(authStr, {
                x: width / 2 - (fontText.widthOfTextAtSize(authStr, 10) / 2),
                y: 45,
                size: 10,
                font: fontText,
                color: rgb(0.5, 0.5, 0.5),
            })
            const siteValidacao = config.site_validacao || 'nexori.com.br'
            const authRefStr = `Verificável em: ${siteValidacao}/validar/${codigoValidacao}`
            page.drawText(authRefStr, {
                x: width / 2 - (fontText.widthOfTextAtSize(authRefStr, 10) / 2),
                y: 30,
                size: 10,
                font: fontText,
                color: rgb(0.5, 0.5, 0.5),
            })
        }

        const pdfBytes = await pdfDoc.save()
        return pdfBytes
    }
}
