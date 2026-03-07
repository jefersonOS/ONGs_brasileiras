import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Users, Building2, ShieldCheck, Search, LayoutDashboard } from 'lucide-react'
import { TenantStatusToggle } from './TenantStatusToggle'

export default async function BackofficePage() {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    )
                }
            }
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.user_metadata?.role !== 'superadmin') {
        redirect('/dashboard')
    }

    // Use a clean Service Role Client (Standard Supabase JS) to bypass RLS entirely
    const adminSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Fetch Stats & Data (Focusing on administrative metrics)
    const [
        { count: totalTenants },
        { count: totalUsers },
        { data: tenants },
        { data: allUsers }
    ] = await Promise.all([
        adminSupabase.from('tenants').select('*', { count: 'exact', head: true }),
        adminSupabase.from('users').select('*', { count: 'exact', head: true }),
        adminSupabase.from('tenants').select('*').order('created_at', { ascending: false }),
        adminSupabase.from('users').select('*, tenant:tenants(nome)').order('created_at', { ascending: false }).limit(20)
    ])

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#1A3C4A] tracking-tighter">Central Administrativa</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Gestão de Licenças e Clientes Nexori</p>
                </div>
            </div>

            {/* Cards de Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: 'Instituições Ativas', value: totalTenants || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Usuários Totais', value: totalUsers || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Status do Sistema', value: 'Operacional', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-8 rounded-[40px] shadow-2xl shadow-black/5 border border-gray-50 flex items-center justify-between group hover:border-[var(--secondary)] transition-all">
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{stat.label}</p>
                            <p className={`font-black text-[#1A3C4A] ${typeof stat.value === 'number' ? 'text-4xl' : 'text-xl'}`}>{stat.value}</p>
                        </div>
                        <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-[24px] flex items-center justify-center transition-transform group-hover:scale-110`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabela de Tenants */}
            <div className="bg-white rounded-[40px] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <h2 className="text-xl font-black text-[#1A3C4A] flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-blue-500" /> Gestão de Mensalidades (Clientes)
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" placeholder="Buscar Instituição..." className="pl-11 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-xs focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                                <th className="px-8 py-5">ONG / Instituição</th>
                                <th className="px-8 py-5">Plano Contratado</th>
                                <th className="px-8 py-5">Status Financeiro</th>
                                <th className="px-8 py-5">Data de Adesão</th>
                                <th className="px-8 py-5 text-right">Controle de Acesso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tenants?.map(t => (
                                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-6">
                                        <div>
                                            <p className="font-black text-[#1A3C4A]">{t.nome}</p>
                                            <p className="text-xs text-gray-400 font-bold">CNPJ: {t.cnpj}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest italic">
                                            {t.plano}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${t.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                            {t.status === 'active' ? 'Regular / Ativo' : 'Pendente / Bloqueado'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-xs text-gray-400 font-bold">
                                        {new Date(t.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2">
                                            <TenantStatusToggle tenantId={t.id} initialStatus={t.status} />
                                            <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-[#1A3C4A] hover:text-white transition-all group-hover:shadow-lg">
                                                <LayoutDashboard className="w-5 h-5" />
                                            </button>
                                        </div>
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
                        <Users className="w-6 h-6 text-purple-500" /> Monitoramento de Usuários
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-50 uppercase text-[10px] font-black text-gray-400 tracking-widest">
                                <th className="px-8 py-5">Nome / Email</th>
                                <th className="px-8 py-5">Instituição</th>
                                <th className="px-8 py-5">Permissão</th>
                                <th className="px-8 py-5">Último Login</th>
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
