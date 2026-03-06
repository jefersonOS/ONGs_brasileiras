import { createClient } from '@/lib/supabase/server'

interface WhatsAppProvider {
    sendMessage(to: string, gatilho: string, dados: Record<string, any>): Promise<{ success: boolean; response: any }>
}

class MetaWhatsAppProvider implements WhatsAppProvider {
    private token: string
    private phoneId: string

    constructor() {
        this.token = process.env.WHATSAPP_META_TOKEN || ''
        this.phoneId = process.env.WHATSAPP_META_PHONE_ID || ''
    }

    async sendMessage(to: string, gatilho: string, dados: Record<string, any>) {
        if (!this.token || !this.phoneId) throw new Error("Meta API não configurada.")

        // Exemplo simplificado de chamada à Cloud API da Meta usando Templates
        // Na prática, gatilho mapearia para nome do template
        const payload = {
            messaging_product: "whatsapp",
            to,
            type: "template",
            template: {
                name: gatilho,
                language: { code: "pt_BR" },
                components: [
                    {
                        type: "body",
                        parameters: Object.values(dados).map(val => ({ type: "text", text: String(val) }))
                    }
                ]
            }
        }

        const res = await fetch(`https://graph.facebook.com/v19.0/${this.phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(payload)
        })

        const data = await res.json()
        return { success: res.ok, response: data }
    }
}

class EvolutionWhatsAppProvider implements WhatsAppProvider {
    private apiUrl: string
    private apiKey: string

    constructor() {
        this.apiUrl = process.env.EVOLUTION_API_URL || ''
        this.apiKey = process.env.EVOLUTION_API_KEY || ''
    }

    async sendMessage(to: string, gatilho: string, dados: Record<string, any>) {
        if (!this.apiUrl || !this.apiKey) throw new Error("Evolution API não configurada.")

        // Construção simulada da string baseada no gatilho
        let text = `Mensagem referente a: ${gatilho}\n\n`
        Object.entries(dados).forEach(([key, val]) => {
            text += `*${key}*: ${val}\n`
        })

        const payload = {
            number: to,
            options: {
                delay: 1200,
                presence: "composing"
            },
            textMessage: {
                text
            }
        }

        const instance = "nexori_instance" // Em produção, deveria vir das configs do tenant
        const res = await fetch(`${this.apiUrl}/message/sendText/${instance}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.apiKey
            },
            body: JSON.stringify(payload)
        })

        const data = await res.json()
        return { success: res.ok, response: data }
    }
}

export class WhatsAppService {
    static async send(tenantId: string, destinatarioId: string, tipoDestinatario: 'cidadao' | 'funcionario', to: string, gatilho: string, dados: any) {
        const supabase = createClient()

        // 1. Busca configurações do Tenant
        const { data: tenant } = await supabase.from('tenants').select('config_portal').eq('id', tenantId).single()

        const config = tenant?.config_portal || {}
        const apiUsada = config.api_whatsapp_ativa === 'meta' ? 'meta' : 'evolution' // Default to evolution

        const provider: WhatsAppProvider = apiUsada === 'meta'
            ? new MetaWhatsAppProvider()
            : new EvolutionWhatsAppProvider()

        let success = false
        let response = null
        let attempts = 0
        const maxAttempts = 3

        // 2. Tenta enviar (com retries)
        while (attempts < maxAttempts && !success) {
            attempts++
            try {
                // Formata número (remover caracteres)
                const limpo = to.replace(/\D/g, '')
                const numeroFinal = limpo.startsWith('55') ? limpo : `55${limpo}`

                const result = await provider.sendMessage(numeroFinal, gatilho, dados)
                success = result.success
                response = result.response
            } catch (err: any) {
                response = { error: err.message }
            }

            if (!success && attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 1000 * attempts)) // Backoff simples
            }
        }

        // 3. Fallback por Email (se falhar as 3 vezes e Resend estiver configurado)
        if (!success && process.env.RESEND_API_KEY) {
            console.log("Fallback de E-mail acionado para:", to)
            // Aqui chamaria o serviço de Email
        }

        // 4. Registra no whatsapp_logs
        await supabase.from('whatsapp_logs').insert({
            tenant_id: tenantId,
            destinatario_id: destinatarioId,
            tipo_destinatario: tipoDestinatario,
            gatilho,
            api_usada: apiUsada,
            numero: to,
            template_usado: gatilho,
            status: success ? 'enviado' : 'falhou',
            resposta_api: response
        })

        return success
    }
}
