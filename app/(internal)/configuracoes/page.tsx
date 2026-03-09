'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Save, Building, Palette, Sparkles, MessageSquare,
    FileText, Users, Upload, Eye,
    CheckCircle, AlertCircle, Loader2, LayoutTemplate, Trash2
} from 'lucide-react'
import { CertPreview } from '@/components/internal/CertPreview'

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
        slug: '',
        dominio_custom: '',
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
        assinatura_url: '',
        titulo: '',
        texto_pre: '',
        texto_pos: '',
        site_validacao: '',
        fundo_url: '',
        nome_instituicao: '',
        alinhamento: 'centro',
        mostrar_borda: true,
        mostrar_codigo: true,
        mostrar_carga_horaria: true,
        mostrar_instituicao: true,
        tam_titulo: 36,
        tam_nome: 32,
        tam_texto: 18,
        tam_instituicao: 16,
        cor_texto: '#4D4D4D',
        cor_nome: '',
        logo_url: '',
        pos_y_conteudo: 0,
        pos_y_rodape: 0,
    })
    const [uploadingFundo, setUploadingFundo] = useState(false)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [uploadingAssinatura, setUploadingAssinatura] = useState(false)

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
                slug: data.slug || '',
                dominio_custom: data.dominio_custom || '',
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
                assinatura_url: cfg.cert_assinatura_url || '',
                titulo: cfg.cert_titulo || '',
                texto_pre: cfg.cert_texto_pre || '',
                texto_pos: cfg.cert_texto_pos || '',
                site_validacao: cfg.cert_site_validacao || '',
                fundo_url: cfg.cert_fundo_url || '',
                nome_instituicao: cfg.cert_nome_instituicao || '',
                alinhamento: cfg.cert_alinhamento || 'centro',
                mostrar_borda: cfg.cert_mostrar_borda !== false,
                mostrar_codigo: cfg.cert_mostrar_codigo !== false,
                mostrar_carga_horaria: cfg.cert_mostrar_carga_horaria !== false,
                mostrar_instituicao: cfg.cert_mostrar_instituicao !== false,
                tam_titulo: cfg.cert_tam_titulo || 36,
                tam_nome: cfg.cert_tam_nome || 32,
                tam_texto: cfg.cert_tam_texto || 18,
                tam_instituicao: cfg.cert_tam_instituicao || 16,
                cor_texto: cfg.cert_cor_texto || '#4D4D4D',
                cor_nome: cfg.cert_cor_nome || '',
                logo_url: cfg.cert_logo_url || '',
                pos_y_conteudo: cfg.cert_pos_y_conteudo ?? 0,
                pos_y_rodape: cfg.cert_pos_y_rodape ?? 0,
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
            cert_assinatura_url: certData.assinatura_url,
            cert_fundo_url: certData.fundo_url || null,
            cert_titulo: certData.titulo,
            cert_texto_pre: certData.texto_pre,
            cert_texto_pos: certData.texto_pos,
            cert_site_validacao: certData.site_validacao,
            cert_nome_instituicao: certData.nome_instituicao,
            cert_alinhamento: certData.alinhamento,
            cert_mostrar_borda: certData.mostrar_borda,
            cert_mostrar_codigo: certData.mostrar_codigo,
            cert_mostrar_carga_horaria: certData.mostrar_carga_horaria,
            cert_mostrar_instituicao: certData.mostrar_instituicao,
            cert_tam_titulo: certData.tam_titulo,
            cert_tam_nome: certData.tam_nome,
            cert_tam_texto: certData.tam_texto,
            cert_tam_instituicao: certData.tam_instituicao,
            cert_cor_texto: certData.cor_texto,
            cert_cor_nome: certData.cor_nome,
            cert_logo_url: certData.logo_url,
            cert_pos_y_conteudo: certData.pos_y_conteudo,
            cert_pos_y_rodape: certData.pos_y_rodape,
        }

        const { error } = await supabase
            .from('tenants')
            .update({
                nome: orgData.nome,
                slug: orgData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || null,
                dominio_custom: orgData.dominio_custom.trim().toLowerCase() || null,
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
            setSaving(false)
            return
        }

        setTenant({ ...tenant, config_portal: newConfig })

        // Registra domínio personalizado na Vercel automaticamente
        const novoDominio = orgData.dominio_custom.trim().toLowerCase()
        const dominioAnterior = tenant.dominio_custom || ''

        if (novoDominio && novoDominio !== dominioAnterior) {
            if (dominioAnterior) {
                await fetch('/api/admin/dominio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dominio: dominioAnterior, action: 'remove' }),
                })
            }
            const vercelRes = await fetch('/api/admin/dominio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dominio: novoDominio }),
            })
            const vercelData = await vercelRes.json()
            if (!vercelData.ok) {
                setMessage({ type: 'success', text: 'Configurações salvas! Aviso: ' + (vercelData.error || 'Não foi possível registrar o domínio na Vercel automaticamente.') })
                setSaving(false)
                return
            }
        } else if (!novoDominio && dominioAnterior) {
            await fetch('/api/admin/dominio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dominio: dominioAnterior, action: 'remove' }),
            })
        }

        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' })
        setSaving(false)
    }

    const inputCls = "w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[var(--secondary)]/20 transition-all"

    const tabs = [
        { id: 'organizacao', label: 'Organização', icon: Building },
        { id: 'visual', label: 'Identidade Visual', icon: Palette },
        { id: 'ai', label: 'IA Central', icon: Sparkles },
        { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
        { id: 'certificados', label: 'Certificados', icon: FileText },
        { id: 'templates', label: 'Templates', icon: LayoutTemplate },
        { id: 'usuarios', label: 'Equipe', icon: Users },
    ]

    // Templates
    const [templates, setTemplates] = useState<any[]>([])
    const [loadingTemplates, setLoadingTemplates] = useState(false)
    const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null)

    useEffect(() => {
        if (activeTab === 'templates') {
            setLoadingTemplates(true)
            supabase.from('templates_plano').select('*').order('created_at', { ascending: false })
                .then(({ data }) => {
                    if (data) setTemplates(data)
                    setLoadingTemplates(false)
                })
        }
    }, [activeTab, supabase])

    const deleteTemplate = async (id: string) => {
        if (!confirm('Excluir este template?')) return
        setDeletingTemplateId(id)
        await supabase.from('templates_plano').delete().eq('id', id)
        setTemplates(prev => prev.filter(t => t.id !== id))
        setDeletingTemplateId(null)
    }

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
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Slug do Portal</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={orgData.slug}
                                                onChange={e => setOrgData({ ...orgData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                                                placeholder="sua-ong"
                                                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[var(--secondary)]/20 transition-all font-bold pr-48"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">.nexori.com.br</span>
                                        </div>
                                        {orgData.slug && (
                                            <p className="text-[10px] text-[var(--secondary)] font-bold ml-1">
                                                Portal: {orgData.slug}.nexori.com.br
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Domínio Personalizado <span className="text-gray-300">(opcional)</span></label>
                                        <input
                                            type="text"
                                            value={orgData.dominio_custom}
                                            onChange={e => setOrgData({ ...orgData, dominio_custom: e.target.value })}
                                            placeholder="portal.suaong.org.br"
                                            className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[var(--secondary)]/20 transition-all font-bold"
                                        />
                                        <div className="ml-1 p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Como configurar seu domínio</p>
                                            <ol className="text-[11px] text-blue-700 space-y-1 font-medium list-decimal list-inside">
                                                <li>Digite o domínio desejado acima e salve.</li>
                                                <li>No painel do seu DNS (Cloudflare, Registro.br, etc), crie um registro <strong>CNAME</strong>:</li>
                                            </ol>
                                            <div className="bg-white rounded-xl p-3 font-mono text-[11px] text-gray-700 border border-blue-100">
                                                <span className="text-blue-500">CNAME</span> {orgData.dominio_custom || 'portal.suaong.org.br'} → <span className="text-green-600">cname.vercel-dns.com</span>
                                            </div>
                                            <p className="text-[10px] text-blue-500 font-medium">A propagação do DNS pode levar até 48h. Após isso, seu portal estará acessível no domínio próprio.</p>
                                        </div>
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
                            <div className="animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 2xl:grid-cols-[1fr_390px] gap-6">
                            <div className="space-y-6">
                                {/* Preview mobile (oculto em telas grandes) */}
                                <div className="2xl:hidden bg-white p-6 rounded-[32px] shadow-xl shadow-black/5 border border-gray-50 overflow-x-auto">
                                    <CertPreview
                                        certData={certData}
                                        corPrimaria={visualData.cor_primaria}
                                        corSecundaria={visualData.cor_secundaria}
                                        tenantNome={tenant?.nome || ''}
                                        scale={0.38}
                                    />
                                </div>

                                {/* Section: Textos */}
                                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-gray-50">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Textos</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Título do Certificado</label>
                                            <input type="text" value={certData.titulo} onChange={e => setCertData({...certData, titulo: e.target.value})} placeholder="CERTIFICADO DE CONCLUSÃO" className={inputCls} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nome da Instituição <span className="normal-case font-normal text-gray-300">(deixe vazio para usar o nome da ONG)</span></label>
                                            <input type="text" value={certData.nome_instituicao || ''} onChange={e => setCertData({...certData, nome_instituicao: e.target.value})} placeholder="Nome oficial da ONG" className={inputCls} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Texto antes do nome</label>
                                            <input type="text" value={certData.texto_pre} onChange={e => setCertData({...certData, texto_pre: e.target.value})} placeholder="Certificamos que" className={inputCls} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Texto após o nome</label>
                                            <input type="text" value={certData.texto_pos} onChange={e => setCertData({...certData, texto_pos: e.target.value})} placeholder="concluiu com êxito o curso de" className={inputCls} />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Site de Validação</label>
                                            <input type="text" value={certData.site_validacao} onChange={e => setCertData({...certData, site_validacao: e.target.value})} placeholder="portal.suaong.org.br" className={inputCls} />
                                            <p className="text-[10px] text-gray-400">Se vazio, usa o domínio personalizado da aba Organização.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Tipografia */}
                                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-gray-50">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Tipografia e Tamanhos</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                        {[
                                            { label: 'Título', key: 'tam_titulo', min: 20, max: 60 },
                                            { label: 'Nome do Aluno', key: 'tam_nome', min: 16, max: 56 },
                                            { label: 'Texto do Corpo', key: 'tam_texto', min: 10, max: 30 },
                                            { label: 'Nome da Inst.', key: 'tam_instituicao', min: 8, max: 28 },
                                        ].map(({ label, key, min, max }) => (
                                            <div key={key} className="space-y-3">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</label>
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="range"
                                                        min={min} max={max}
                                                        value={certData[key as keyof typeof certData] as number}
                                                        onChange={e => setCertData({...certData, [key]: Number(e.target.value)})}
                                                        className="flex-1 accent-[#2D9E6B]"
                                                    />
                                                    <span className="text-sm font-black text-[#1A3C4A] w-8 text-right">{certData[key as keyof typeof certData]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section: Posição Vertical */}
                                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-gray-50">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Posição Vertical dos Elementos</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {[
                                            { label: 'Título / Textos / Nome do Aluno', key: 'pos_y_conteudo', desc: 'Move o bloco principal de conteúdo' },
                                            { label: 'Responsável / Assinatura', key: 'pos_y_rodape', desc: 'Move a assinatura e nome do responsável' },
                                        ].map(({ label, key, desc }) => (
                                            <div key={key} className="space-y-3">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</label>
                                                    <p className="text-[9px] text-gray-300 mt-0.5">{desc}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[9px] font-bold text-gray-300">↓</span>
                                                    <input
                                                        type="range"
                                                        min={-150} max={150}
                                                        value={certData[key as keyof typeof certData] as number}
                                                        onChange={e => setCertData({...certData, [key]: Number(e.target.value)})}
                                                        className="flex-1 accent-[#2D9E6B]"
                                                    />
                                                    <span className="text-[9px] font-bold text-gray-300">↑</span>
                                                    <span className="text-sm font-black text-[#1A3C4A] w-12 text-right">
                                                        {(certData[key as keyof typeof certData] as number) > 0 ? '+' : ''}{certData[key as keyof typeof certData]}
                                                    </span>
                                                    {(certData[key as keyof typeof certData] as number) !== 0 && (
                                                        <button type="button" onClick={() => setCertData({...certData, [key]: 0})} className="text-[9px] font-black text-gray-300 hover:text-red-400 uppercase">reset</button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section: Cores */}
                                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-gray-50">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Cores</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Cor Primária', stateKey: 'cor_primaria', isVisual: true },
                                            { label: 'Cor Secundária', stateKey: 'cor_secundaria', isVisual: true },
                                            { label: 'Cor do Texto', stateKey: 'cor_texto', isVisual: false },
                                            { label: 'Cor do Nome', stateKey: 'cor_nome', isVisual: false, placeholder: 'Usa Cor Secundária' },
                                        ].map(({ label, stateKey, isVisual, placeholder }) => (
                                            <div key={stateKey} className="space-y-3">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{label}</label>
                                                <div className="flex gap-3 items-center">
                                                    <input
                                                        type="color"
                                                        value={isVisual
                                                            ? (visualData[stateKey as keyof typeof visualData] || '#000000')
                                                            : (certData[stateKey as keyof typeof certData] as string || '#4D4D4D')}
                                                        onChange={e => isVisual
                                                            ? setVisualData({...visualData, [stateKey]: e.target.value})
                                                            : setCertData({...certData, [stateKey]: e.target.value})}
                                                        className="w-12 h-12 rounded-xl border-none p-1 cursor-pointer bg-gray-50"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={isVisual
                                                            ? (visualData[stateKey as keyof typeof visualData] || '')
                                                            : (certData[stateKey as keyof typeof certData] as string || '')}
                                                        onChange={e => isVisual
                                                            ? setVisualData({...visualData, [stateKey]: e.target.value})
                                                            : setCertData({...certData, [stateKey]: e.target.value})}
                                                        placeholder={placeholder || '#000000'}
                                                        className="flex-1 px-3 py-2 bg-gray-50 rounded-xl text-xs font-mono"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Section: Layout */}
                                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-gray-50">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Layout e Visibilidade</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Alinhamento do Texto</p>
                                            <div className="flex bg-gray-100 p-1 rounded-2xl w-fit gap-1">
                                                {(['esquerda', 'centro', 'direita'] as const).map(a => (
                                                    <button
                                                        key={a} type="button"
                                                        onClick={() => setCertData({...certData, alinhamento: a})}
                                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${certData.alinhamento === a ? 'bg-white shadow-md text-[#1A3C4A]' : 'text-gray-400 hover:text-gray-600'}`}
                                                    >
                                                        {a === 'esquerda' ? '⬅ Esq.' : a === 'centro' ? '↔ Centro' : 'Dir. ➡'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Mostrar / Ocultar Elementos</p>
                                            {[
                                                { key: 'mostrar_borda', label: 'Borda decorativa' },
                                                { key: 'mostrar_instituicao', label: 'Nome da Instituição' },
                                                { key: 'mostrar_carga_horaria', label: 'Carga Horária' },
                                                { key: 'mostrar_codigo', label: 'Código de Validação' },
                                            ].map(({ key, label }) => (
                                                <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                                                    <span className="text-sm font-bold text-[#1A3C4A]">{label}</span>
                                                    <div className="relative">
                                                        <input
                                                            type="checkbox"
                                                            checked={certData[key as keyof typeof certData] as boolean}
                                                            onChange={e => setCertData({...certData, [key]: e.target.checked})}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2D9E6B]"></div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Assinatura */}
                                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-gray-50">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Assinatura</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Nome do Responsável</label>
                                                <input type="text" value={certData.nome_responsavel} onChange={e => setCertData({...certData, nome_responsavel: e.target.value})} placeholder="Ex: Maria Silva" className={inputCls} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Cargo</label>
                                                <input type="text" value={certData.cargo_responsavel} onChange={e => setCertData({...certData, cargo_responsavel: e.target.value})} placeholder="Ex: Coordenadora Geral" className={inputCls} />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Imagem da Assinatura</label>
                                            <label className={`flex flex-col items-center justify-center gap-2 w-full p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploadingAssinatura ? 'opacity-50 pointer-events-none' : 'border-gray-200 hover:border-[#2D9E6B]'}`}>
                                                {certData.assinatura_url ? (
                                                    <div className="w-full space-y-2">
                                                        <img src={certData.assinatura_url} alt="Assinatura" className="h-16 mx-auto object-contain" />
                                                        <p className="text-[10px] font-bold text-[#2D9E6B] text-center">✓ Clique para substituir</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-6 h-6 text-gray-300" />
                                                        <span className="text-[10px] font-black uppercase text-gray-400">{uploadingAssinatura ? 'Enviando...' : 'Upload assinatura (PNG/JPG)'}</span>
                                                    </>
                                                )}
                                                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={async (e) => {
                                                    const file = e.target.files?.[0]; if (!file) return
                                                    setUploadingAssinatura(true)
                                                    const fd = new FormData(); fd.append('file', file)
                                                    const res = await fetch('/api/configuracoes/certificados/upload-fundo', { method: 'POST', body: fd })
                                                    const data = await res.json()
                                                    if (data.url) setCertData(prev => ({...prev, assinatura_url: data.url}))
                                                    setUploadingAssinatura(false); e.target.value = ''
                                                }} />
                                            </label>
                                            {certData.assinatura_url && <button type="button" onClick={() => setCertData(prev => ({...prev, assinatura_url: ''}))} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase">Remover assinatura</button>}
                                        </div>
                                    </div>
                                </div>

                                {/* Section: Logo e Fundo */}
                                <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-black/5 border border-gray-50">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Logo e Fundo</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Logo da Instituição no Certificado</label>
                                            <p className="text-[10px] text-gray-400">Aparece no canto superior esquerdo. Use PNG com fundo transparente.</p>
                                            <label className={`flex flex-col items-center justify-center gap-2 w-full p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploadingLogo ? 'opacity-50 pointer-events-none' : 'border-gray-200 hover:border-[#2D9E6B]'}`}>
                                                {certData.logo_url ? (
                                                    <div className="w-full space-y-2">
                                                        <img src={certData.logo_url} alt="Logo" className="h-16 mx-auto object-contain" />
                                                        <p className="text-[10px] font-bold text-[#2D9E6B] text-center">✓ Clique para substituir</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-6 h-6 text-gray-300" />
                                                        <span className="text-[10px] font-black uppercase text-gray-400">{uploadingLogo ? 'Enviando...' : 'Upload logo (PNG/JPG)'}</span>
                                                    </>
                                                )}
                                                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={async (e) => {
                                                    const file = e.target.files?.[0]; if (!file) return
                                                    setUploadingLogo(true)
                                                    const fd = new FormData(); fd.append('file', file)
                                                    const res = await fetch('/api/configuracoes/certificados/upload-fundo', { method: 'POST', body: fd })
                                                    const data = await res.json()
                                                    if (data.url) setCertData(prev => ({...prev, logo_url: data.url}))
                                                    setUploadingLogo(false); e.target.value = ''
                                                }} />
                                            </label>
                                            {certData.logo_url && <button type="button" onClick={() => setCertData(prev => ({...prev, logo_url: ''}))} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase">Remover logo</button>}
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Imagem de Fundo</label>
                                            <p className="text-[10px] text-gray-400">A4 paisagem — 2480×1754 px recomendado. O texto é sobreposto.</p>
                                            <label className={`flex flex-col items-center justify-center gap-2 w-full p-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploadingFundo ? 'opacity-50 pointer-events-none' : 'border-gray-200 hover:border-[#2D9E6B]'}`}>
                                                {certData.fundo_url ? (
                                                    <div className="w-full space-y-2">
                                                        <img src={certData.fundo_url} alt="Fundo" className="w-full h-24 object-cover rounded-xl" />
                                                        <p className="text-[10px] font-bold text-[#2D9E6B] text-center">✓ Clique para substituir</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-6 h-6 text-gray-300" />
                                                        <span className="text-[10px] font-black uppercase text-gray-400">{uploadingFundo ? 'Enviando...' : 'Upload fundo (PNG/JPG)'}</span>
                                                    </>
                                                )}
                                                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={async (e) => {
                                                    const file = e.target.files?.[0]; if (!file) return
                                                    setUploadingFundo(true)
                                                    const fd = new FormData(); fd.append('file', file)
                                                    const res = await fetch('/api/configuracoes/certificados/upload-fundo', { method: 'POST', body: fd })
                                                    const data = await res.json()
                                                    if (data.url) setCertData(prev => ({...prev, fundo_url: data.url}))
                                                    setUploadingFundo(false); e.target.value = ''
                                                }} />
                                            </label>
                                            {certData.fundo_url && <button type="button" onClick={() => setCertData(prev => ({...prev, fundo_url: ''}))} className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase">Remover fundo</button>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Preview sticky */}
                            <div className="hidden 2xl:block">
                                <div className="sticky top-6 space-y-4">
                                    <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-black/5 border border-gray-50">
                                        <CertPreview
                                            certData={certData}
                                            corPrimaria={visualData.cor_primaria}
                                            corSecundaria={visualData.cor_secundaria}
                                            tenantNome={tenant?.nome || ''}
                                            scale={0.41}
                                        />
                                    </div>
                                    <p className="text-[9px] text-gray-300 text-center font-bold uppercase tracking-widest">O preview é aproximado. O PDF final pode ter pequenas diferenças.</p>
                                </div>
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

                        {activeTab === 'templates' && (
                            <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-100 animate-in fade-in duration-500">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-[#1A3C4A] tracking-tighter">Templates de Plano de Trabalho</h3>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Templates salvos a partir de PDFs importados</p>
                                    </div>
                                    <div className="w-12 h-12 bg-[#1A3C4A]/5 rounded-2xl flex items-center justify-center">
                                        <LayoutTemplate className="w-5 h-5 text-[#1A3C4A]" />
                                    </div>
                                </div>

                                {loadingTemplates ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin text-[#2D9E6B]" />
                                    </div>
                                ) : templates.length === 0 ? (
                                    <div className="text-center py-16 space-y-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-[24px] flex items-center justify-center mx-auto">
                                            <LayoutTemplate className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-gray-400 text-sm font-medium">Nenhum template salvo ainda.</p>
                                        <p className="text-xs text-gray-400">Importe um PDF na página de Planos de Trabalho e salve-o como template.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {templates.map(t => (
                                            <div key={t.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl border border-gray-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-[#1A3C4A]/10 rounded-xl flex items-center justify-center shrink-0">
                                                        <FileText className="w-5 h-5 text-[#1A3C4A]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-[#1A3C4A]">{t.nome}</p>
                                                        {t.descricao && <p className="text-xs text-gray-400 mt-0.5">{t.descricao}</p>}
                                                        <p className="text-[10px] text-gray-300 mt-1">{t.secoes?.length || 0} seções · {new Date(t.created_at).toLocaleDateString('pt-BR')}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteTemplate(t.id)}
                                                    disabled={deletingTemplateId === t.id}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                                    title="Excluir template"
                                                >
                                                    {deletingTemplateId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab !== 'templates' && (
                        <div className="flex justify-end pt-10">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-[#1A3C4A] text-white px-12 py-5 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-[var(--secondary)] transition-all shadow-2xl shadow-black/20 flex items-center gap-4 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Alterações</>}
                            </button>
                        </div>
                        )}

                    </form>
                </div>
            </div>
        </div>
    )
}
