import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const { titulo } = await req.json()
        if (!titulo?.trim()) return Response.json({ error: 'Título obrigatório' }, { status: 400 })

        // Busca a chave OpenAI da mesma forma que o ai-service.ts:
        // 1. Chave do tenant (config_portal.ai_key_openai)
        // 2. Fallback para variável de ambiente OPENAI_API_KEY
        const supabaseAuth = createClient()
        const { data: { user } } = await supabaseAuth.auth.getUser()

        let apiKey = process.env.OPENAI_API_KEY

        if (user?.user_metadata?.tenant_id) {
            const { data: tenant } = await supabaseAuth
                .from('tenants')
                .select('config_portal')
                .eq('id', user.user_metadata.tenant_id)
                .single()

            const tenantKey = tenant?.config_portal?.ai_key_openai
            if (tenantKey) apiKey = tenantKey
        }

        if (!apiKey) return Response.json({ error: 'Chave OpenAI não configurada. Adicione em Configurações > IA.' }, { status: 500 })

        // 1. Gerar imagem com DALL-E 3
        const dalleRes = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: `Professional course thumbnail illustration for a Brazilian NGO vocational training course titled "${titulo}". Modern flat design, vibrant gradient background, educational theme, inspiring and warm colors. Abstract shapes and educational symbols. Absolutely no text, no letters, no words, no numbers anywhere in the image.`,
                n: 1,
                size: '1792x1024',
                quality: 'standard',
                response_format: 'url',
            }),
        })

        if (!dalleRes.ok) {
            const err = await dalleRes.json()
            return Response.json({ error: err.error?.message || 'Erro na geração da imagem' }, { status: 500 })
        }

        const dalleData = await dalleRes.json()
        const imageUrl = dalleData.data?.[0]?.url
        if (!imageUrl) return Response.json({ error: 'Imagem não gerada' }, { status: 500 })

        // 2. Baixar a imagem gerada
        const imgRes = await fetch(imageUrl)
        const imgBuffer = await imgRes.arrayBuffer()

        // 3. Upload para o Supabase Storage
        const supabase = createAdminClient()
        const fileName = `thumb-${Date.now()}.png`

        const { error: uploadError } = await supabase.storage
            .from('thumbnails')
            .upload(fileName, imgBuffer, {
                contentType: 'image/png',
                upsert: false,
            })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('thumbnails')
            .getPublicUrl(fileName)

        return Response.json({ url: publicUrl })

    } catch (error: any) {
        console.error('Gerar thumb erro:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
