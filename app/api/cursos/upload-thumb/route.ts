import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File | null
        if (!file) return Response.json({ error: 'Arquivo não enviado' }, { status: 400 })

        const ext = file.name.split('.').pop() || 'png'
        const fileName = `thumb-${Date.now()}.${ext}`
        const buffer = await file.arrayBuffer()

        const supabase = createAdminClient()
        const { error: uploadError } = await supabase.storage
            .from('thumbnails')
            .upload(fileName, buffer, { contentType: file.type, upsert: false })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('thumbnails').getPublicUrl(fileName)

        return Response.json({ url: publicUrl })
    } catch (error: any) {
        console.error('Upload thumb erro:', error)
        return Response.json({ error: error.message }, { status: 500 })
    }
}
