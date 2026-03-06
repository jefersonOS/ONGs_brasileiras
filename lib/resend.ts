import { Resend } from 'resend'

export async function sendEmail({ to, subject, html }: { to: string, subject: string, html: string }) {
    if (!process.env.RESEND_API_KEY) {
        console.log('Skipping email send: RESEND_API_KEY not found')
        return { success: true, mock: true }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    try {
        const { data, error } = await resend.emails.send({
            from: 'Nexori <onboarding@resend.dev>', // Em produção, usar domínio verificado
            to,
            subject,
            html,
        })

        if (error) throw error
        return { success: true, data }
    } catch (error) {
        console.error('Email Send Error:', error)
        return { success: false, error }
    }
}
