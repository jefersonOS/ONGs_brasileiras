import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const FILE_PATHS: Record<string, string> = {
    fundo: 'fundos/fundo-cert',
    assinatura: 'assinaturas/responsavel',
    assinatura_mediador: 'assinaturas/mediador',
    logo: 'logos/logo-cert',
}

export async function POST(req: Request) {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 })

        const tenantId = user.user_metadata?.tenant_id
        if (!tenantId) return Response.json({ error: 'Tenant não encontrado' }, { status: 400 })

        const { searchParams } = new URL(req.url)
        const type = searchParams.get('type') || 'fundo'
        const basePath = FILE_PATHS[type] ?? FILE_PATHS.fundo

        const formData = await req.formData()
        const file = formData.get('file') as File | null
        if (!file) return Response.json({ error: 'Arquivo não enviado' }, { status: 400 })

        const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
        if (!['png', 'jpg', 'jpeg'].includes(ext)) {
            return Response.json({ error: 'Formato inválido. Use PNG ou JPG.' }, { status: 400 })
        }

        const fileName = `${tenantId}/${basePath}.${ext}`
        const buffer = await file.arrayBuffer()

        const admin = createAdminClient()
        const { error: uploadError } = await admin.storage
            .from('certificados')
            .upload(fileName, buffer, { contentType: file.type, upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = admin.storage.from('certificados').getPublicUrl(fileName)

        return Response.json({ url: publicUrl })
    } catch (error: any) {
        console.error('Upload cert erro:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
