import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID

export async function POST(req: Request) {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
            return NextResponse.json({ error: 'Variáveis VERCEL_TOKEN e VERCEL_PROJECT_ID não configuradas' }, { status: 500 })
        }

        const { dominio, action } = await req.json()

        if (!dominio) {
            return NextResponse.json({ error: 'Domínio não informado' }, { status: 400 })
        }

        if (action === 'remove') {
            // Remove o domínio do projeto na Vercel
            const res = await fetch(
                `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${dominio}`,
                {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
                }
            )
            if (!res.ok && res.status !== 404) {
                const err = await res.json()
                return NextResponse.json({ error: err.error?.message || 'Erro ao remover domínio na Vercel' }, { status: 400 })
            }
            return NextResponse.json({ ok: true, message: 'Domínio removido da Vercel' })
        }

        // Adiciona o domínio ao projeto na Vercel
        const res = await fetch(
            `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${VERCEL_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: dominio }),
            }
        )

        const data = await res.json()

        if (!res.ok) {
            // Domínio já adicionado = não é erro
            if (data.error?.code === 'domain_already_in_use' || data.error?.code === 'domain_already_exists') {
                return NextResponse.json({ ok: true, message: 'Domínio já estava registrado' })
            }
            return NextResponse.json({ error: data.error?.message || 'Erro ao adicionar domínio na Vercel' }, { status: 400 })
        }

        return NextResponse.json({
            ok: true,
            message: 'Domínio registrado na Vercel com sucesso',
            verified: data.verified,
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
