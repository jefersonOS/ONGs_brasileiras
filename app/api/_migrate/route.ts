import { Client } from 'pg'

export async function GET(req: Request) {
    const secret = new URL(req.url).searchParams.get('secret')
    if (secret !== 'nexori-migrate-2026') {
        return new Response('Unauthorized', { status: 401 })
    }

    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
        return new Response('DATABASE_URL não definida no .env.local', { status: 500 })
    }

    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
    try {
        await client.connect()
        await client.query("ALTER TABLE turmas ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'curso'")
        await client.end()
        return Response.json({ ok: true, message: 'Coluna tipo adicionada com sucesso!' })
    } catch (e: any) {
        return Response.json({ ok: false, error: e.message }, { status: 500 })
    }
}
