import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { feedbackSchema } from '@/lib/feedback'

export async function POST(request: NextRequest) {
    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const result = feedbackSchema.safeParse(body)
    if (!result.success) {
        return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('feedbacks').insert({
        message: result.data.message,
        user_id: user?.id ?? null,
        created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
}
