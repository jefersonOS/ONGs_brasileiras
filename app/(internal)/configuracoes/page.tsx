'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Building, Link as LinkIcon, MessageSquare, ShieldCheck, Info, Wifi, Smartphone } from 'lucide-react'

export default function ConfiguracoesPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [tenant, setTenant] = useState<any>(null)
    const [message, setMessage] = useState({ type: '', text: '' })

    // Dados Básicos
    const [nome, setNome] = useState('')
    const [slug, setSlug] = useState('')

    // Configurações Globais (config_portal)
    const [apiAtiva, setApiAtiva] = useState('evolution')

    // Meta
    const [metaPhoneId, setMetaPhoneId] = useState('')
    const [metaToken, setMetaToken] = useState('')
    const [metaWebhook, setMetaWebhook] = useState('')

    // Evolution
    const [evoUrl, setEvoUrl] = useState('')
    const [evoKey, setEvoKey] = useState('')
    const [evoInstance, setEvoInstance] = useState('')

    const [testNumber, setTestNumber] = useState('')

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return setLoading(false)

        const tenantId = user.user_metadata?.tenant_id
        if (!tenantId) return setLoading(false)

        const { data } = await supabase.from('tenants').select('*').eq('id', tenantId).single()

        if (data) {
            setTenant(data)
            setNome(data.nome || '') // Corrigido de name para nome conforme schema
            setSlug(data.dominio_custom || '')

            const cfg = data.config_portal || {}
            setApiAtiva(cfg.whatsapp_api_ativa || 'evolution')

            setMetaPhoneId(cfg.whatsapp_meta_phone_id || '')
            setMetaToken(cfg.whatsapp_meta_token || '')
            setMetaWebhook(cfg.whatsapp_meta_webhook_token || '')

            setEvoUrl(cfg.whatsapp_evolution_url || '')
            setEvoKey(cfg.whatsapp_evolution_key || '')
            setEvoInstance(cfg.whatsapp_evolution_instance || '')
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage({ type: '', text: '' })

        if (!tenant) return

        const configPortal = {
            ...(tenant.config_portal || {}),
            whatsapp_api_ativa: apiAtiva,
            whatsapp_meta_phone_id: metaPhoneId,
            whatsapp_meta_token: metaToken,
            whatsapp_meta_webhook_token: metaWebhook,
            whatsapp_evolution_url: evoUrl,
            whatsapp_evolution_key: evoKey,
            whatsapp_evolution_instance: evoInstance
        }

        const { error } = await supabase
            .from('tenants')
            .update({
                nome,
                config_portal: configPortal
            })
            .eq('id', tenant.id)

        if (error) {
            setMessage({ type: 'error', text: 'Erro ao salvar: ' + error.message })
        } else {
            setMessage({ type: 'success', text: 'Configurações atualizadas com sucesso!' })
            setTenant({ ...tenant, config_portal: configPortal })
        }
        setSaving(false)
    }

    const handleTestConnection = async () => {
        if (!testNumber) return alert('Informe um número para teste (ex: 5511999999999)')

        setTesting(true)
        try {
            const config = apiAtiva === 'meta'
                ? { phoneId: metaPhoneId, token: metaToken }
                : { apiUrl: evoUrl, apiKey: evoKey, instance: evoInstance }

            const res = await fetch('/api/configuracoes/whatsapp/testar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: apiAtiva, config, testNumber })
            })
            const data = await res.json()
            alert(data.message)
        } catch (err) {
            alert('Falha ao conectar com o serviço.')
        } finally {
            setTesting(false)
        }
    }

    if (loading) return <div className="p-8 text-center animate-pulse">Carregando configurações...</div>

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div>
                <h1 className="text-3xl font-black text-[#1A3C4A]">Configurações</h1>
                <p className="text-gray-500 font-medium">Personalize a identidade e integrações da sua ONG.</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-2xl border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                    <p className="text-sm font-bold">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Dados da ONG */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-[#2D9E6B]">
                            <Building className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-black text-[#1A3C4A]">Dados da Instituição</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400 ml-1">Nome da ONG</label>
                            <input type="text" value={nome} onChange={e => setNome(e.target.value)} required className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D9E6B]/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-gray-400 ml-1">Subdomínio / Slug</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">nexori.com/</span>
                                <input type="text" value={slug} disabled className="w-full pl-[92px] pr-5 py-3 border border-gray-100 bg-gray-50 rounded-2xl text-gray-400 cursor-not-allowed" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* WhatsApp Dual API */}
                <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                <MessageSquare className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-black text-[#1A3C4A]">WhatsApp Dual API</h2>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => setApiAtiva('meta')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${apiAtiva === 'meta' ? 'bg-white shadow-sm text-[#1A3C4A]' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Meta Official
                            </button>
                            <button
                                type="button"
                                onClick={() => setApiAtiva('evolution')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${apiAtiva === 'evolution' ? 'bg-white shadow-sm text-[#1A3C4A]' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Evolution API
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            {apiAtiva === 'meta' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-black uppercase text-gray-400">Access Token (Bearer)</label>
                                        <input type="password" value={metaToken} onChange={e => setMetaToken(e.target.value)} placeholder="EAAG..." className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-400">Phone Number ID</label>
                                        <input type="text" value={metaPhoneId} onChange={e => setMetaPhoneId(e.target.value)} placeholder="123456789..." className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-400">Webhook Verify Token</label>
                                        <input type="text" value={metaWebhook} onChange={e => setMetaWebhook(e.target.value)} placeholder="Token de verificação customizado" className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-xs font-black uppercase text-gray-400">URL do Servidor Evolution</label>
                                        <input type="url" value={evoUrl} onChange={e => setEvoUrl(e.target.value)} placeholder="https://api.suaong.org" className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D9E6B]/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-400">Global API Key</label>
                                        <input type="password" value={evoKey} onChange={e => setEvoKey(e.target.value)} placeholder="••••••••••••" className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D9E6B]/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black uppercase text-gray-400">Nome da Instância</label>
                                        <input type="text" value={evoInstance} onChange={e => setEvoInstance(e.target.value)} placeholder="Ex: nexori_ong" className="w-full px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#2D9E6B]/20" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 p-6 rounded-[24px] border border-gray-100 flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-[#1A3C4A] mb-4">
                                    <Wifi className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase">Testar Conexão</span>
                                </div>
                                <p className="text-xs text-gray-500 mb-6 font-medium">Envie uma mensagem de teste para verificar se as chaves estão corretas.</p>
                                <div className="relative mb-4">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="5511999999999"
                                        value={testNumber}
                                        onChange={e => setTestNumber(e.target.value)}
                                        className="w-full pl-11 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleTestConnection}
                                disabled={testing}
                                className="w-full py-2 bg-white border border-gray-200 text-[#1A3C4A] text-[10px] font-black uppercase rounded-xl hover:bg-gray-100 transition-all shadow-sm"
                            >
                                {testing ? 'Enviando...' : 'Executar Teste'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#2D9E6B] text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-600 transition-all shadow-xl shadow-green-900/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar Tudo</>}
                    </button>
                </div>
            </form>
        </div>
    )
}
