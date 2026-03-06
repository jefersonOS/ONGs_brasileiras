'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Building2, CheckCircle2, XCircle, Settings2, Search } from 'lucide-react'

export default function BackofficePage() {
    const supabase = createClient()
    const [tenants, setTenants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState('')

    // Filtro e Busca
    const [busca, setBusca] = useState('')

    const fetchTenants = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            setUserRole(user.user_metadata?.role || '')
        }

        // Isso poderia requerer bypass no RLS ou uma policy específica para "superadmin" visualizar todos os tenants
        // Por MVP, vamos tentar buscar, se a policy bloquear retornará []
        const { data } = await supabase.from('tenants').select('*').order('created_at', { ascending: false })
        if (data) setTenants(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchTenants()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const toggleTenantStatus = async (id: string, currentStatus: boolean) => {
        await supabase.from('tenants').update({ active: !currentStatus }).eq('id', id)
        fetchTenants()
    }

    if (loading) {
        return (
            <div className="flex-1 p-8 flex justify-center items-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#2D9E6B] border-t-transparent rounded-full"></div>
            </div>
        )
    }

    if (userRole !== 'superadmin' && userRole !== 'proprietario') {
        return (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Acesso Restrito</h1>
                <p className="text-gray-500 mt-2">Você não tem permissão para acessar o Backoffice da Plataforma.</p>
            </div>
        )
    }

    const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(busca.toLowerCase()))

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Backoffice Global</h1>
                    <p className="text-gray-500 mt-1">Gestão de Organizações (Tenants) e Planos do SaaS</p>
                </div>
                <button className="bg-[#2D9E6B] hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Registrar Instituição
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar organização..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTenants.map(tenant => (
                    <div key={tenant.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-teal-50 text-[#2E6B7A] rounded-lg flex items-center justify-center font-bold text-lg uppercase shadow-inner">
                                    {tenant.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 leading-tight">{tenant.name}</h3>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">{tenant.slug}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${tenant.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {tenant.active ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                        <div className="p-5 space-y-3 flex-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Building2 className="w-4 h-4 text-gray-400" />
                                Plano: <span className="font-semibold text-gray-800 capitalize">{tenant.plan || 'Free'}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                                <span>Criado em:</span>
                                <span className="font-semibold">{new Date(tenant.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-2">
                            <button
                                onClick={() => toggleTenantStatus(tenant.id, tenant.active)}
                                className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors ${tenant.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            >
                                {tenant.active ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                {tenant.active ? 'Suspender' : 'Ativar'}
                            </button>
                            <button className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-colors bg-white border border-gray-200 text-gray-700 hover:bg-gray-100">
                                <Settings2 className="w-4 h-4" /> Ajustes
                            </button>
                        </div>
                    </div>
                ))}

                {filteredTenants.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhuma organização encontrada.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
