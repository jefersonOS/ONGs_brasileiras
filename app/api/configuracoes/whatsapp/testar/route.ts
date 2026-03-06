export async function POST(req: Request) {
    try {
        const { provider, config, testNumber } = await req.json()

        let success = false
        let message = ''

        if (provider === 'meta') {
            const res = await fetch(`https://graph.facebook.com/v19.0/${config.phoneId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.token}`
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: testNumber.replace(/\D/g, ''),
                    type: "text",
                    text: { body: "Teste de conexão Nexori - Meta API ✅" }
                })
            })
            const data = await res.json()
            success = res.ok
            message = success ? 'Conexão Meta OK!' : `Erro Meta: ${data.error?.message || 'Falha desconhecida'}`
        } else {
            const res = await fetch(`${config.apiUrl}/message/sendText/${config.instance}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': config.apiKey
                },
                body: JSON.stringify({
                    number: testNumber.replace(/\D/g, ''),
                    textMessage: { text: "Teste de conexão Nexori - Evolution API ✅" }
                })
            })
            const data = await res.json()
            success = res.ok
            message = success ? 'Conexão Evolution OK!' : `Erro Evolution: ${data.message || 'Falha na instância'}`
        }

        return Response.json({ success, message })

    } catch (error: any) {
        return Response.json({ success: false, message: error.message }, { status: 500 })
    }
}
