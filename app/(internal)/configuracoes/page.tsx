'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Save, Building, Palette, Sparkles, MessageSquare,
    FileText, Users, Upload, Eye,
    CheckCircle, AlertCircle, Loader2
} from 'lucide-react'

export default function ConfiguracoesPage() {
    const supabase = createClient()
    const [activeTab, setActiveTab] = useState('organizacao')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [tenant, setTenant] = useState<any>(null)
    const [message, setMessage] = useState({ type: '', text: '' })

    // Aba Organização
    const [orgData, setOrgData] = useState({
        nome: '',
        cnpj: '',
        endereco: '',
        telefone: '',
        email: '',
        logo_url: ''
    })

    // Aba Identidade Visual
    const [visualData, setVisualData] = useState({
        cor_primaria: '#1A3C4A',
        cor_secundaria: '#2D9E6B',
        portal_logo_url: ''
    })

    // Aba IA
    const [aiData, setAiData] = useState({
        modelo_ativo: 'claude-3-5-sonnet',
        modelo_fallback: 'gpt-4o',
        key_claude: '',
        key_openai: '',
        key_google: '',
        ia_ativa: true,
        limite_tokens: 100000
    })

    // Aba WhatsApp
    const [whatsappData, setWhatsappData] = useState({
        api_ativa: 'evolution',
        meta_phone_id: '',
        meta_token: '',
        meta_webhook: '',
        evo_url: '',
        evo_key: '',
        evo_instance: ''
    })

    // Aba Certificados
    const [certData, setCertData] = useState({
        nome_responsavel: '',
        cargo_responsavel: '',
        assinatura_url: ''
    })

    const fetchData = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return setLoading(false)

        const tenantId = user.user_metadata?.tenant_id
        if (!tenantId) return setLoading(false)

        const { data } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
        if (data) {
            setTenant(data)
            setOrgData({
                nome: data.nome || '',
                cnpj: data.cnpj || '',
                endereco: data.endereco || '',
                telefone: data.telefone || '',
                email: data.email || '',
                logo_url: data.logo_url || ''
            })

            const cfg = data.config_portal || {}
            setVisualData({
                cor_primaria: cfg.cor_primaria || '#1A3C4A',
                cor_secundaria: cfg.cor_secundaria || '#2D9E6B',
                portal_logo_url: cfg.portal_logo_url || ''
            })

            setAiData({
                modelo_ativo: cfg.ai_modelo_ativo || 'claude-3-5-sonnet',
                modelo_fallback: cfg.ai_modelo_fallback || 'gpt-4o',
                key_claude: cfg.ai_key_claude || '',
                key_openai: cfg.ai_key_openai || '',
                key_google: cfg.ai_key_google || '',
                ia_ativa: cfg.ai_ativa !== false,
                limite_tokens: cfg.ai_limite_tokens || 100000
            })

            setWhatsappData({
                api_ativa: cfg.whatsapp_api_ativa || 'evolution',
                meta_phone_id: cfg.whatsapp_meta_phone_id || '',
                meta_token: cfg.whatsapp_meta_token || '',
                meta_webhook: cfg.whatsapp_meta_webhook_token || '',
                evo_url: cfg.whatsapp_evolution_url || '',
                evo_key: cfg.whatsapp_evolution_key || '',
                evo_instance: cfg.whatsapp_evolution_instance || ''
            })

            setCertData({
                nome_responsavel: cfg.cert_nome_responsavel || '',
                cargo_responsavel: cfg.cert_cargo_responsavel || '',
                assinatura_url: cfg.cert_assinatura_url || ''
            })
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage({ type: '', text: '' })

        const newConfig = {
            ...tenant.config_portal,
            cor_primaria: visualData.cor_primaria,
            cor_secundaria: visualData.cor_secundaria,
            portal_logo_url: visualData.portal_logo_url,
            ai_modelo_ativo: aiData.modelo_ativo,
            ai_modelo_fallback: aiData.modelo_fallback,
            ai_key_claude: aiData.key_claude,
            ai_key_openai: aiData.key_openai,
            ai_key_google: aiData.key_google,
            ai_ativa: aiData.ia_ativa,
            ai_limite_tokens: aiData.limite_tokens,
            whatsapp_api_ativa: whatsappData.api_ativa,
            whatsapp_meta_phone_id: whatsappData.meta_phone_id,
            whatsapp_meta_token: whatsappData.meta_token,
            whatsapp_meta_webhook_token: whatsappData.meta_webhook,
            whatsapp_evolution_url: whatsappData.evo_url,
            whatsapp_evolution_key: whatsappData.evo_key,
            whatsapp_evolution_instance: whatsappData.evo_instance,
            cert_nome_responsavel: certData.nome_responsavel,
            cert_cargo_responsavel: certData.cargo_responsavel,
            cert_assinatura_url: certData.assinatura_url
        }

        const { error } = await supabase
            .from('tenants')
            .update({
                nome: orgData.nome,
                cnpj: orgData.cnpj,
                endereco: orgData.endereco,
                telefone: orgData.telefone,
                email: orgData.email,
                logo_url: orgData.logo_url,
                config_portal: newConfig
            })
            .eq('id', tenant.id)

        if (error) {
            setMessage({ type: 'error', text: 'Erro ao salvar: ' + error.message })
        } else {
            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
            setTenant({ ...tenant, config_portal: newConfig })
        }
        setSaving(false)
    }

    const tabs = [
        { id: 'organizacao', label: 'Organização', icon: Building },
        { id: 'visual', label: 'Identidade Visual', icon: Palette },
        { id: 'ai', label: 'IA Central', icon: Sparkles },
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
        { id: 'certificados', label: 'Certificados', icon: FileText },
        { id: 'usuarios', label: 'Equipe', icon: Users },
    ]

    if (loading) return <div className="p-8 text-center animate-pulse">Carregando configurações...</div>

    return (
        <div className="max-w-6xl mx-auto pb-20 space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#1A3C4A] tracking-tighter">Painel de Configurações</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Personalize cada detalhe da sua instituição</p>
                </div>
                {message.text && (
                    <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl border animate-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                        {message.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        <span className="text-xs font-black uppercase">{message.text}</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
                {/* Sidebar Menu */}
                <div className="lg:w-72 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest ${activeTab === tab.id ? 'bg-[#1A3C4A] text-white shadow-xl shadow-black/10' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-50'}`}
                        >
                            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-[var(--secondary)]' : 'text-gray-300'}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    <form onSubmit={handleSave} className="space-y-8">

                        {activeTab === 'organizacao' && (
                            <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-50 animate-in fade-in duration-500">
                                <h3 className="text-xl font-black text-[#1A3C4A] mb-8">Dados da Instituição</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Nome da ONG</label>
                                        <input type="text" value={orgData.nome} onChange={e => setOrgData({ ...orgData, nome: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[var(--secondary)]/20 transition-all font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">CNPJ</label>
                                        <input type="text" value={orgData.cnpj} onChange={e => setOrgData({ ...orgData, cnpj: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[var(--secondary)]/20 transition-all font-bold" />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Endereço Completo</label>
                                        <input type="text" value={orgData.endereco} onChange={e => setOrgData({ ...orgData, endereco: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[var(--secondary)]/20 transition-all font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Telefone</label>
                                        <input type="text" value={orgData.telefone} onChange={e => setOrgData({ ...orgData, telefone: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[var(--secondary)]/20 transition-all font-bold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">E-mail Público</label>
                                        <input type="email" value={orgData.email} onChange={e => setOrgData({ ...orgData, email: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[var(--secondary)]/20 transition-all font-bold" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'visual' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-50">
                                    <h3 className="text-xl font-black text-[#1A3C4A] mb-8">Personalização do Portal</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cor Primária</label>
                                                <div className="flex gap-4 items-center">
                                                    <input type="color" value={visualData.cor_primaria} onChange={e => setVisualData({ ...visualData, cor_primaria: e.target.value })} className="w-16 h-16 rounded-2xl border-none p-1 cursor-pointer bg-gray-50" />
                                                    <input type="text" value={visualData.cor_primaria} onChange={e => setVisualData({ ...visualData, cor_primaria: e.target.value })} className="flex-1 px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold uppercase tracking-widest" />
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cor Secundária</label>
                                                <div className="flex gap-4 items-center">
                                                    <input type="color" value={visualData.cor_secundaria} onChange={e => setVisualData({ ...visualData, cor_secundaria: e.target.value })} className="w-16 h-16 rounded-2xl border-none p-1 cursor-pointer bg-gray-50" />
                                                    <input type="text" value={visualData.cor_secundaria} onChange={e => setVisualData({ ...visualData, cor_secundaria: e.target.value })} className="flex-1 px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold uppercase tracking-widest" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100">
                                            <div className="flex items-center gap-2 text-[#1A3C4A] mb-6">
                                                <Eye className="w-4 h-4" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Preview em Tempo Real</span>
                                            </div>
                                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 aspect-video flex flex-col scale-90">
                                                <div className="h-6 w-full flex items-center px-4 gap-2" style={{ backgroundColor: visualData.cor_primaria }}>
                                                    <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                                    <div className="w-12 h-1.5 rounded-full bg-white/20"></div>
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    <div className="h-2 w-2/3 bg-gray-100 rounded-full"></div>
                                                    <div className="h-2 w-1/2 bg-gray-100 rounded-full"></div>
                                                    <div className="h-8 w-full rounded-xl mt-4" style={{ backgroundColor: visualData.cor_secundaria }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-100 animate-in fade-in duration-500">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-xl font-black text-[#1A3C4A]">Inteligência Artificial</h3>
                                    <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">IA Ativa</span>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={aiData.ia_ativa} onChange={e => setAiData({ ...aiData, ia_ativa: e.target.checked })} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--secondary)]"></div>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Modelo Principal</label>
                                            <select value={aiData.modelo_ativo} onChange={e => setAiData({ ...aiData, modelo_ativo: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[var(--secondary)]/20">
                                                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                                                <option value="gpt-4o">GPT-4o</option>
                                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Modelo Fallback</label>
                                            <select value={aiData.modelo_fallback} onChange={e => setAiData({ ...aiData, modelo_fallback: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[var(--secondary)]/20">
                                                <option value="gpt-4o">GPT-4o</option>
                                                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                                                <option value="claude-3-haiku">Claude 3 Haiku</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Limite Mensal de Tokens</label>
                                            <input type="number" value={aiData.limite_tokens} onChange={e => setAiData({ ...aiData, limite_tokens: parseInt(e.target.value) })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold" />
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 space-y-6">
                                        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">API Keys (Criptografadas)</h4>
                                        <div className="space-y-4">
                                            <input type="password" placeholder="Anthropic Key" value={aiData.key_claude} onChange={e => setAiData({ ...aiData, key_claude: e.target.value })} className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[var(--secondary)]/20" />
                                            <input type="password" placeholder="OpenAI Key" value={aiData.key_openai} onChange={e => setAiData({ ...aiData, key_openai: e.target.value })} className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[var(--secondary)]/20" />
                                            <input type="password" placeholder="Google AI Key" value={aiData.key_google} onChange={e => setAiData({ ...aiData, key_google: e.target.value })} className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[var(--secondary)]/20" />
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-1 mt-4">Somente serão usadas se fornecidas. Caso contrário, o sistema usará a chave global do administrador conforme o plano.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'whatsapp' && (
                            <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-100 animate-in fade-in duration-500">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-xl font-black text-[#1A3C4A]">Serviço de WhatsApp</h3>
                                    <div className="flex bg-gray-100 p-1 rounded-2xl">
                                        <button type="button" onClick={() => setWhatsappData({ ...whatsappData, api_ativa: 'meta' })} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${whatsappData.api_ativa === 'meta' ? 'bg-white shadow-lg text-[#1A3C4A]' : 'text-gray-400'}`}>Meta Oficial</button>
                                        <button type="button" onClick={() => setWhatsappData({ ...whatsappData, api_ativa: 'evolution' })} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${whatsappData.api_ativa === 'evolution' ? 'bg-white shadow-lg text-[#1A3C4A]' : 'text-gray-400'}`}>Evolution API</button>
                                    </div>
                                </div>

                                {whatsappData.api_ativa === 'meta' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Token de Acesso</label>
                                            <input type="password" value={whatsappData.meta_token} onChange={e => setWhatsappData({ ...whatsappData, meta_token: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Phone ID</label>
                                            <input type="text" value={whatsappData.meta_phone_id} onChange={e => setWhatsappData({ ...whatsappData, meta_phone_id: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Webhook Verify Token</label>
                                            <input type="text" value={whatsappData.meta_webhook} onChange={e => setWhatsappData({ ...whatsappData, meta_webhook: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-left-4">
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">URL da Instância</label>
                                            <input type="url" value={whatsappData.evo_url} onChange={e => setWhatsappData({ ...whatsappData, evo_url: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">API Key</label>
                                            <input type="password" value={whatsappData.evo_key} onChange={e => setWhatsappData({ ...whatsappData, evo_key: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Nome da Instância</label>
                                            <input type="text" value={whatsappData.evo_instance} onChange={e => setWhatsappData({ ...whatsappData, evo_instance: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'certificados' && (
                            <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-100 animate-in fade-in duration-500">
                                <h3 className="text-xl font-black text-[#1A3C4A] mb-8">Configuração de Certificados</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Responsável pela Assinatura</label>
                                            <input type="text" value={certData.nome_responsavel} onChange={e => setCertData({ ...certData, nome_responsavel: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Cargo do Responsável</label>
                                            <input type="text" value={certData.cargo_responsavel} onChange={e => setCertData({ ...certData, cargo_responsavel: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Selo / Logo do Certificado</label>
                                            <div className="w-full p-8 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:border-[var(--secondary)] transition-all cursor-pointer group">
                                                <Upload className="w-8 h-8 text-gray-300 group-hover:text-[var(--secondary)]" />
                                                <span className="text-[10px] font-black uppercase text-gray-400">Clique para fazer upload</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#1A3C4A] rounded-[40px] p-8 text-white flex flex-col justify-between shadow-2xl shadow-black/20">
                                        <div>
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Visualização do Certificado</span>
                                            <div className="mt-8 border border-white/10 rounded-2xl p-6 relative overflow-hidden bg-white/5">
                                                <div className="flex justify-between mb-10">
                                                    <div className="w-12 h-12 bg-white/10 rounded-lg"></div>
                                                    <div className="w-16 h-16 border-2 border-white/5 rounded-full flex items-center justify-center text-[8px] opacity-20">SELO</div>
                                                </div>
                                                <h4 className="text-xl font-black mb-4 tracking-tight">CERTIFICADO</h4>
                                                <div className="h-1.5 w-1/2 bg-[var(--secondary)] mb-6"></div>
                                                <p className="text-[8px] leading-relaxed opacity-60">Certificamos que [NOME] participou do curso [TÍTULO] com carga horária de [X] horas.</p>

                                                <div className="mt-12 pt-4 border-t border-white/10">
                                                    <p className="text-[10px] font-black">{certData.nome_responsavel || 'Nome do Responsável'}</p>
                                                    <p className="text-[8px] opacity-40 uppercase tracking-widest leading-none mt-1">{certData.cargo_responsavel || 'Cargo'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button type="button" className="w-full py-4 mt-8 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Ver PDF de Exemplo</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'usuarios' && (
                            <div className="bg-white p-12 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-50 animate-in fade-in duration-500 text-center space-y-8">
                                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[30px] flex items-center justify-center mx-auto shadow-xl shadow-blue-500/10">
                                    <Users className="w-10 h-10" />
                                </div>
                                <div className="max-w-md mx-auto space-y-3">
                                    <h3 className="text-2xl font-black text-[#1A3C4A] tracking-tighter">Gestão de Equipe e Permissões</h3>
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                        Agora a gestão de colaboradores, convites e controle de acesso granular possui uma área dedicada e mais segura.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="button"
                                        onClick={() => window.location.href = '/configuracoes/equipe'}
                                        className="inline-flex items-center gap-3 px-10 py-5 bg-[#1A3C4A] text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-[#2D9E6B] transition-all shadow-2xl shadow-black/20"
                                    >
                                        Acessar Painel da Equipe
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-10">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-[#1A3C4A] text-white px-12 py-5 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-[var(--secondary)] transition-all shadow-2xl shadow-black/20 flex items-center gap-4 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Alterações</>}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}
