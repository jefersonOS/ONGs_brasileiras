import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VERCEL_TOKEN = Deno.env.get('VERCEL_TOKEN')
const VERCEL_PROJECT_ID = Deno.env.get('VERCEL_PROJECT_ID')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Verifica autenticação do usuário
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const { data: { user }, error: authError } = await supabase.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Não autorizado' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
            return new Response(JSON.stringify({ error: 'VERCEL_TOKEN ou VERCEL_PROJECT_ID não configurados nos secrets do Supabase' }), {
                status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const { dominio, action } = await req.json()

        if (!dominio) {
            return new Response(JSON.stringify({ error: 'Domínio não informado' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (action === 'remove') {
            const res = await fetch(
                `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${dominio}`,
                { method: 'DELETE', headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
            )
            if (!res.ok && res.status !== 404) {
                const err = await res.json()
                return new Response(JSON.stringify({ error: err.error?.message || 'Erro ao remover na Vercel' }), {
                    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }
            return new Response(JSON.stringify({ ok: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Adiciona domínio na Vercel
        const res = await fetch(
            `https://api.vercel.com/v10/projects/${VERCEL_PROJECT_ID}/domains`,
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: dominio }),
            }
        )

        const data = await res.json()

        if (!res.ok) {
            if (data.error?.code === 'domain_already_in_use' || data.error?.code === 'domain_already_exists') {
                return new Response(JSON.stringify({ ok: true, message: 'Domínio já registrado' }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }
            return new Response(JSON.stringify({ error: data.error?.message || 'Erro ao adicionar na Vercel' }), {
                status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify({ ok: true, verified: data.verified }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
