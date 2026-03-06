import { createClient } from '@/lib/supabase/server'

interface WhatsAppProvider {
    sendMessage(to: string, message: string): Promise<{ success: boolean; response: any }>
}

class MetaWhatsAppProvider implements WhatsAppProvider {
    constructor(private config: { token: string; phoneId: string }) { }

    async sendMessage(to: string, message: string) {
        if (!this.config.token || !this.config.phoneId) throw new Error("Meta API não configurada.")

        // Se for uma mensagem simples (sem template), usamos o type 'text'
        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "text",
            text: { body: message }
        }

        const res = await fetch(`https://graph.facebook.com/v19.0/${this.config.phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.token}`
            },
            body: JSON.stringify(payload)
        })

        const data = await res.json()
        return { success: res.ok, response: data }
    }
}

class EvolutionWhatsAppProvider implements WhatsAppProvider {
    constructor(private config: { apiUrl: string; apiKey: string; instance: string }) { }

    async sendMessage(to: string, message: string) {
        if (!this.config.apiUrl || !this.config.apiKey || !this.config.instance) {
            throw new Error("Evolution API não configurada.")
        }

        const payload = {
            number: to,
            options: {
                delay: 1200,
                presence: "composing"
            },
            textMessage: {
                text: message
            }
        }

        const res = await fetch(`${this.config.apiUrl}/message/sendText/${this.config.instance}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': this.config.apiKey
            },
            body: JSON.stringify(payload)
        })

        const data = await res.json()
        return { success: res.ok, response: data }
    }
}

export class WhatsAppService {
    static async enviar(tenantId: string, to: string, gatilho: string, dados: any) {
        const supabase = createClient()

        // 1. Busca configurações do Tenant
        const { data: tenant } = await supabase.from('tenants').select('config_portal').eq('id', tenantId).single()
        const config = tenant?.config_portal || {}
        const apiAtiva = config.whatsapp_api_ativa || 'evolution'

        // 2. Monta a mensagem
        const mensagem = this.montarMensagem(gatilho, dados)

        let provider: WhatsAppProvider | null = null

        if (apiAtiva === 'meta') {
            provider = new MetaWhatsAppProvider({
                token: config.whatsapp_meta_token,
                phoneId: config.whatsapp_meta_phone_id
            })
        } else {
            provider = new EvolutionWhatsAppProvider({
                apiUrl: config.whatsapp_evolution_url,
                apiKey: config.whatsapp_evolution_key,
                instance: config.whatsapp_evolution_instance
            })
        }

        let success = false
        let response = null
        let attempts = 0
        const maxAttempts = 3

        // 3. Tenta enviar (com retries)
        const limpo = to.replace(/\D/g, '')
        const numeroFinal = limpo.startsWith('55') ? limpo : `55${limpo}`

        while (attempts < maxAttempts && !success) {
            attempts++
            try {
                const result = await provider.sendMessage(numeroFinal, mensagem)
                success = result.success
                response = result.response
            } catch (err: any) {
                response = { error: err.message }
            }

            if (!success && attempts < maxAttempts) {
                await new Promise(r => setTimeout(r, 1000 * attempts))
            }
        }

        // 4. Fallback por Email (Mock)
        if (!success) {
            console.error(`Falha ao enviar WhatsApp para ${to}. Tentando fallback...`)
        }

        // 5. Registra no whatsapp_logs
        await supabase.from('whatsapp_logs').insert({
            tenant_id: tenantId,
            gatilho,
            api_usada: apiAtiva,
            numero: to,
            template_usado: gatilho,
            status: success ? 'enviado' : 'falhou',
            resposta_api: response
        })

        return success
    }

    static montarMensagem(gatilho: string, dados: any): string {
        const mensagens: Record<string, string> = {
            inscricao_confirmada: `✅ Olá ${dados.nome}! Sua inscrição em *${dados.evento}* foi confirmada!\n📅 Data: ${dados.data}\n📍 Local: ${dados.local}\n\nAté lá!`,
            lembrete_24h: `⏰ Lembrete: Amanhã é o dia de *${dados.evento}*!\n📅 ${dados.data} às ${dados.horario}\n📍 ${dados.local}`,
            certificado_disponivel: `🎓 Seu certificado de *${dados.curso}* está disponível!\nAcesse: ${dados.link}`,
            comprovante_disponivel: `📄 Seu comprovante de participação em *${dados.atividade}* está disponível!\nAcesse: ${dados.link}`,
        }
        return mensagens[gatilho] || dados.mensagem || "Mensagem Nexori"
    }
}
