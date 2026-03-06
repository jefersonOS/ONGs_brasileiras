import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, Building2, ShieldCheck, ChevronRight, Search, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

export default async function BackofficePage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || (user.user_metadata?.role !== 'superadmin' && user.user_metadata?.role !== 'proprietario')) {
        redirect('/dashboard')
    }

    // 1. Fetch Stats
    const [
        { count: totalTenants },
        { count: totalUsers },
        { data: tenants },
        { data: allUsers }
    ] = await Promise.all([
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('tenants').select('*').order('created_at', { ascending: false }),
        supabase.from('users').select('*, tenant:tenants(nome)').order('created_at', { ascending: false }).limit(20)
    ])

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#1A3C4A] tracking-tighter">Central do Backoffice</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Gestão Global da Plataforma Nexori</p>
                </div>
                <div className="flex gap-4">
                    {/* Ações rápidas podem ir aqui */}
                </div>
            </div>

            {/* Cards de Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Total de Clientes', value: totalTenants || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Usuários Registrados', value: totalUsers || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Assinaturas Ativas', value: totalTenants || 0, icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-50 flex items-center justify-between group hover:border-[var(--secondary)] transition-all">
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{stat.label}</p>
                            <p className="text-4xl font-black text-[#1A3C4A]">{stat.value}</p>
                        </div>
                        <div className={`w-16 h-16 ${stat.bg} ${stat.color} rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <stat.icon className="w-8 h-8" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabela de Tenants */}
            <div className="bg-white rounded-[40px] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h2 className="text-xl font-black text-[#1A3C4A] flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-blue-500" /> Clientes (Tenants)
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Buscar ONG..." className="pl-11 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                                <th className="px-8 py-5">ONG / Instituição</th>
                                <th className="px-8 py-5">Plano</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5">Criação</th>
                                <th className="px-8 py-5 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants?.map(t => (
                                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div>
                                            <p className="font-black text-[#1A3C4A]">{t.nome}</p>
                                            <p className="text-xs text-gray-400 font-bold">{t.dominio_custom || `${t.slug}.nexori.com`}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <select className="bg-white border border-gray-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase text-[#1A3C4A] focus:outline-none">
                                            <option value="gratuito" selected={t.plano === 'gratuito'}>Gratuito</option>
                                            <option value="pro" selected={t.plano === 'pro'}>Pro</option>
                                            <option value="enterprise" selected={t.plano === 'enterprise'}>Enterprise</option>
                                        </select>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${t.status === 'ativo' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-xs text-gray-400 font-bold">
                                        {new Date(t.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all group-hover:shadow-lg shadow-blue-500/10">
                                            <LayoutDashboard className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Tabela de Usuários */}
            <div className="bg-white rounded-[40px] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h2 className="text-xl font-black text-[#1A3C4A] flex items-center gap-3">
                        <Users className="w-6 h-6 text-purple-500" /> Últimos Usuários
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                                <th className="px-8 py-5">Nome / Email</th>
                                <th className="px-8 py-5">Instituição</th>
                                <th className="px-8 py-5">Role</th>
                                <th className="px-8 py-5">Registro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allUsers?.map(u => (
                                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div>
                                            <p className="font-black text-[#1A3C4A]">{u.nome || 'N/A'}</p>
                                            <p className="text-xs text-gray-400 font-bold">{u.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-xs font-bold text-gray-500">
                                        {u.tenant?.nome || 'Sem Tenant'}
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[9px] font-black uppercase text-gray-500 tracking-widest">
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-xs text-gray-400 font-bold">
                                        {new Date(u.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
