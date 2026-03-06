'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Building, Link as LinkIcon, MessageSquare, ShieldCheck, Info } from 'lucide-react'

export default function ConfiguracoesPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [tenant, setTenant] = useState<any>(null)
    const [message, setMessage] = useState({ type: '', text: '' })

    // Formulário
    const [name, setName] = useState('')
    const [slug, setSlug] = useState('')
    const [whatsappConfig, setWhatsappConfig] = useState('meta')
    const [evolutionUrl, setEvolutionUrl] = useState('')
    const [evolutionKey, setEvolutionKey] = useState('')

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || (!user.user_metadata?.tenant_id && user.user_metadata?.role !== 'superadmin')) {
            setLoading(false)
            return
        }

        const tenantIdToFetch = user.user_metadata?.tenant_id || '00000000-0000-0000-0000-000000000000' // Superadmin might need a selector in real life

        const { data } = await supabase.from('tenants').select('*').eq('id', tenantIdToFetch).single()

        if (data) {
            setTenant(data)
            setName(data.name || '')
            setSlug(data.slug || '')
            setWhatsappConfig(data.whatsapp_config || 'meta')
            setEvolutionUrl(data.evolution_url || '')
            setEvolutionKey(data.evolution_api_key || '')
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

        const { error } = await supabase
            .from('tenants')
            .update({
                name,
                slug,
                whatsapp_config: whatsappConfig,
                evolution_url: evolutionUrl,
                evolution_api_key: evolutionKey
            })
            .eq('id', tenant.id)

        if (error) {
            setMessage({ type: 'error', text: 'Erro ao salvar as configurações: ' + error.message })
        } else {
            setMessage({ type: 'success', text: 'Configurações atualizadas com sucesso!' })
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex-1 p-8 flex justify-center items-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#2D9E6B] border-t-transparent rounded-full"></div>
            </div>
        )
    }

    if (!tenant) {
        return (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-16 h-16 text-gray-300 mb-4" />
                <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
                <p className="text-gray-500 mt-2">Você não possui permissão para editar as configurações desta Organização.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div>
                <h1 className="text-2xl font-bold text-[#1A3C4A]">Configurações da Instituição</h1>
                <p className="text-gray-500 mt-1">Gerencie os dados, integrações e links públicos da ONG.</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-md flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {message.type === 'error' ? <div className="font-bold">❌</div> : <div className="font-bold">✅</div>}
                    <p className="text-sm font-medium">{message.text}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">

                {/* Seção Dados Básicos */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                        <Building className="w-5 h-5 text-[#2D9E6B]" />
                        <h2 className="text-lg font-bold text-gray-800">Dados da Instituição</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nome de Exibição</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B] transition-shadow"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Slug (URL Pública)</label>
                            <div className="flex">
                                <span className="inline-flex items-center px-4 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">
                                    nexori.com/
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={slug}
                                    onChange={e => setSlug(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-r-lg focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B] transition-shadow"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                                <Info className="w-3 h-3 mt-0.5" /> O slug é usado para identificar sua ONG em links públicos.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Seção WhatsApp e Integrações */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                        <MessageSquare className="w-5 h-5 text-[#2D9E6B]" />
                        <h2 className="text-lg font-bold text-gray-800">Serviço de Mensageria Automática</h2>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Provedor Principal (Notificações)</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className={`border rounded-lg p-4 cursor-pointer transition-all ${whatsappConfig === 'meta' ? 'border-[#2D9E6B] bg-green-50/50 ring-1 ring-[#2D9E6B]' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="provider" value="meta" checked={whatsappConfig === 'meta'} onChange={() => setWhatsappConfig('meta')} className="w-4 h-4 text-[#2D9E6B] focus:ring-[#2D9E6B]" />
                                        <div>
                                            <p className="font-bold text-gray-800">Meta Cloud API (Oficial)</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Utiliza chaves globais da plataforma Nexori.</p>
                                        </div>
                                    </div>
                                </label>

                                <label className={`border rounded-lg p-4 cursor-pointer transition-all ${whatsappConfig === 'evolution' ? 'border-[#2D9E6B] bg-green-50/50 ring-1 ring-[#2D9E6B]' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="provider" value="evolution" checked={whatsappConfig === 'evolution'} onChange={() => setWhatsappConfig('evolution')} className="w-4 h-4 text-[#2D9E6B] focus:ring-[#2D9E6B]" />
                                        <div>
                                            <p className="font-bold text-gray-800">Evolution API (Customizado)</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Conecte sua própria instância via Evolution.</p>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {whatsappConfig === 'evolution' && (
                            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4 text-slate-500" /> Credenciais Evolution
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">URL da Instância / API</label>
                                        <input
                                            type="url"
                                            value={evolutionUrl}
                                            onChange={e => setEvolutionUrl(e.target.value)}
                                            placeholder="https://api.evolution.suaong.org"
                                            className="w-full px-4 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Global API Key</label>
                                        <input
                                            type="password"
                                            value={evolutionKey}
                                            onChange={e => setEvolutionKey(e.target.value)}
                                            placeholder="••••••••••••••••"
                                            className="w-full px-4 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Flutuante de Save */}
                <div className="sticky bottom-6 bg-white border border-gray-200 shadow-xl p-4 rounded-xl flex items-center justify-between">
                    <div className="hidden sm:block">
                        <p className="text-sm font-bold text-gray-800">Salvar Alterações</p>
                        <p className="text-xs text-gray-500">As configurações entram em vigor imediatamente.</p>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full sm:w-auto bg-[#1A3C4A] hover:bg-[#2E6B7A] text-white px-8 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <><Save className="w-5 h-5" /> Confirmar e Salvar</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
