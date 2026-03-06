import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export class PDFService {
    static async generateCertificate(
        nomeCidadao: string,
        tituloEntidade: string,
        tipo: 'certificado' | 'comprovante',
        dataEmissao: Date,
        cargaHoraria: string | number,
        nomeInstituicao: string,
        codigoValidacao: string
    ): Promise<Uint8Array> {
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
        const primaryColor = rgb(0.10, 0.24, 0.29) // Equivalente aproximado ao #1A3C4A
        const highlightColor = rgb(0.18, 0.62, 0.42) // Equivalente ao #2D9E6B
        const textColor = rgb(0.3, 0.3, 0.3)

        // Bordas e Design Base
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

        // Cabeçalho / Instituição
        page.drawText(nomeInstituicao.toUpperCase(), {
            x: width / 2 - (fontTitle.widthOfTextAtSize(nomeInstituicao.toUpperCase(), 16) / 2),
            y: height - 80,
            size: 16,
            font: fontTitle,
            color: primaryColor,
        })

        // Título Principal
        const tituloDoc = tipo === 'certificado' ? 'CERTIFICADO DE CONCLUSÃO' : 'COMPROVANTE DE PARTICIPAÇÃO'
        page.drawText(tituloDoc, {
            x: width / 2 - (fontTitle.widthOfTextAtSize(tituloDoc, 36) / 2),
            y: height - 160,
            size: 36,
            font: fontTitle,
            color: primaryColor,
        })

        // Corpo do Texto
        const textPre = tipo === 'certificado'
            ? 'Certificamos que'
            : 'Comprovamos para os devidos fins que'

        page.drawText(textPre, {
            x: width / 2 - (fontText.widthOfTextAtSize(textPre, 18) / 2),
            y: height - 230,
            size: 18,
            font: fontText,
            color: textColor,
        })

        // Nome do Participante (Destaque)
        page.drawText(nomeCidadao.toUpperCase(), {
            x: width / 2 - (fontTitle.widthOfTextAtSize(nomeCidadao.toUpperCase(), 32) / 2),
            y: height - 280,
            size: 32,
            font: fontTitle,
            color: highlightColor,
        })

        // Continuação do Texto
        const textPos = tipo === 'certificado'
            ? `concluiu com êxito o curso de`
            : `esteve presente na atividade de`

        page.drawText(textPos, {
            x: width / 2 - (fontText.widthOfTextAtSize(textPos, 18) / 2),
            y: height - 330,
            size: 18,
            font: fontText,
            color: textColor,
        })

        // Nome do Curso/Atividade
        page.drawText(`"${tituloEntidade}"`, {
            x: width / 2 - (fontTitle.widthOfTextAtSize(`"${tituloEntidade}"`, 24) / 2),
            y: height - 370,
            size: 24,
            font: fontTitle,
            color: primaryColor,
        })

        // Carga Horária (se houver)
        if (cargaHoraria && cargaHoraria !== '0') {
            const extraText = `com carga horária total de ${cargaHoraria} horas.`
            page.drawText(extraText, {
                x: width / 2 - (fontText.widthOfTextAtSize(extraText, 16) / 2),
                y: height - 410,
                size: 16,
                font: fontText,
                color: textColor,
            })
        }

        // Rodapé Data e Assinatura
        const dateStr = `Emitido em ${dataEmissao.toLocaleDateString('pt-BR')}`
        page.drawText(dateStr, {
            x: 100,
            y: 100,
            size: 14,
            font: fontText,
            color: textColor,
        })

        page.drawLine({
            start: { x: width - 300, y: 120 },
            end: { x: width - 100, y: 120 },
            thickness: 1,
            color: primaryColor,
        })

        page.drawText('Assinatura Eletrônica / Coordenação', {
            x: width - 285,
            y: 100,
            size: 12,
            font: fontItalic,
            color: textColor,
        })

        // Código de Validação
        const authStr = `Código de Autenticação: ${codigoValidacao}`
        page.drawText(authStr, {
            x: width / 2 - (fontText.widthOfTextAtSize(authStr, 10) / 2),
            y: 45,
            size: 10,
            font: fontText,
            color: rgb(0.5, 0.5, 0.5),
        })
        const authRefStr = `Verificável em: ngobrasil.com/validar/${codigoValidacao}`
        page.drawText(authRefStr, {
            x: width / 2 - (fontText.widthOfTextAtSize(authRefStr, 10) / 2),
            y: 30,
            size: 10,
            font: fontText,
            color: rgb(0.5, 0.5, 0.5),
        })

        const pdfBytes = await pdfDoc.save()
        return pdfBytes
    }
}
