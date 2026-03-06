import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/resend'

export async function POST(req: Request) {
    try {
        const { email, role, tenantId, tenantNome } = await req.json()

        // 1. Gerar link de convite (simulado com deep link para o portal)
        // Em um cenário real, salvaríamos no banco um token de convite
        const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nexori.com'}/cadastro?tenant=${tenantId}&invite=true`

        // 2. Enviar e-mail via Resend
        await sendEmail({
            to: email,
            subject: `Convite para participar da equipe ${tenantNome} - Nexori`,
            html: `
                <div style="font-family: sans-serif; color: #1A3C4A; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px;">
                    <h1 style="color: #2D9E6B; font-size: 24px; font-weight: 900;">Você foi convidado!</h1>
                    <p>Olá,</p>
                    <p>Você foi convidado para participar da plataforma <strong>Nexori</strong> como parte da equipe da ONG <strong>${tenantNome}</strong> com a função de <strong>${role}</strong>.</p>
                    
                    <div style="margin: 40px 0;">
                        <a href="${inviteLink}" style="background: #1A3C4A; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block;">Aceitar Convite e Configurar Conta</a>
                    </div>

                    <p style="font-size: 12px; color: #999;">Se você não esperava este convite, pode ignorar este e-mail.</p>
                    <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 30px 0;" />
                    <p style="font-size: 10px; color: #ccc; text-transform: uppercase; letter-spacing: 1px;">Nexori SaaS • Gestão de Impacto Social</p>
                </div>
            `
        })

        return Response.json({ success: true })

    } catch (error: any) {
        console.error('Invite Error:', error)
        return new Response(error.message, { status: 500 })
    }
}
