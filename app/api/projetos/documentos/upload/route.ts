import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        const documentoId = formData.get('documentoId') as string | null
        const projetoId = formData.get('projetoId') as string | null

        if (!file || !documentoId || !projetoId) {
            return Response.json({ error: 'Dados incompletos' }, { status: 400 })
        }

        const ext = file.name.split('.').pop() || 'bin'
        const fileName = `${projetoId}/${documentoId}-${Date.now()}.${ext}`
        const buffer = await file.arrayBuffer()

        const adminClient = createAdminClient()
        const { error: uploadError } = await adminClient.storage
            .from('projeto-documentos')
            .upload(fileName, buffer, { contentType: file.type, upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = adminClient.storage
            .from('projeto-documentos')
            .getPublicUrl(fileName)

        const supabase = createClient()
        const { error: updateError } = await supabase
            .from('projeto_documentos')
            .update({ arquivo_url: publicUrl, status: 'enviado', updated_at: new Date().toISOString() })
            .eq('id', documentoId)

        if (updateError) throw updateError

        return Response.json({ url: publicUrl })
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 })
    }
}
