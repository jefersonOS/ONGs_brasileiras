import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

export async function POST(req: Request) {
    try {
        const { tombamento, tenantId } = await req.json()
        const supabase = createClient()

        if (!tombamento) return new Response('Tombamento missing', { status: 400 })

        // 1. Gerar URL do QR Code (Página Pública)
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nexori.vercel.app'
        const publicUrl = `${baseUrl}/patrimonio/bem/${tombamento}`

        // 2. Gerar SVG do QR Code
        const qrSvg = await QRCode.toString(publicUrl, {
            type: 'svg',
            color: {
                dark: '#1A3C4A',
                light: '#00000000' // Transparent background
            }
        })

        // 3. Upload para Supabase Storage (Bucket: patrimonio)
        const fileName = `qrcodes/${tombamento}.svg`
        const { error: uploadError } = await supabase.storage
            .from('patrimonio')
            .upload(fileName, qrSvg, {
                contentType: 'image/svg+xml',
                upsert: true
            })

        if (uploadError) throw uploadError

        // 4. Obter URL Pública
        const { data: { publicUrl: qrFileUrl } } = supabase.storage
            .from('patrimonio')
            .getPublicUrl(fileName)

        // 5. Atualizar registro do bem
        const { error: updateError } = await supabase
            .from('patrimonio_bens')
            .update({ qrcode_url: qrFileUrl })
            .eq('tombamento', tombamento)
            .eq('tenant_id', tenantId)

        if (updateError) throw updateError

        return Response.json({ success: true, url: qrFileUrl })

    } catch (error: any) {
        console.error('QR Generation Error:', error)
        return new Response(error.message, { status: 500 })
    }
}
