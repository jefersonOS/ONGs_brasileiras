'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    ShieldCheck,
    FolderOpen,
    FileText,
    Wallet,
    CalendarDays,
    GraduationCap,
    Building2,
    ScrollText,
    Settings,
    Plus,
    Users
} from 'lucide-react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const MENU_ITEMS = [
    { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Backoffice', href: '/backoffice', icon: ShieldCheck, adminOnly: true },
    { name: 'Projetos', href: '/projetos', icon: FolderOpen, module: 'atividades' },
    { name: 'Planos de Trabalho', href: '/planos-trabalho', icon: FileText, module: 'planos_trabalho' },
    { name: 'Prestações de Contas', href: '/prestacoes-contas', icon: Wallet, module: 'prestacoes_contas' },
    { name: 'Atividades', href: '/atividades', icon: CalendarDays, module: 'atividades' },
    { name: 'Cursos', href: '/cursos', icon: GraduationCap, module: 'atividades' },
    { name: 'Patrimônio', href: '/patrimonio', icon: Building2, module: 'patrimonio' },
    { name: 'Minha Equipe', href: '/configuracoes/equipe', icon: Users, ownerOnly: true },
    { name: 'Logs de Auditoria', href: '/logs-auditoria', icon: ScrollText, adminOnly: true },
    { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const [userRole, setUserRole] = useState('')
    const [userName, setUserName] = useState('')
    const [permissions, setPermissions] = useState<Record<string, boolean>>({})
    const supabase = createClient()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUserRole(data.user.user_metadata?.role || 'membro')
                setUserName(data.user.user_metadata?.nome || data.user.email)
                setPermissions(data.user.user_metadata?.permissoes || {})
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <aside className="w-[220px] fixed inset-y-0 left-0 bg-[var(--primary)] text-white flex flex-col z-20">
            <div className="h-[60px] flex items-center px-6 font-bold text-xl border-b border-white/10">
                Nexori
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                {/* Menu Principal */}
                <nav className="space-y-1 px-3">
                    {MENU_ITEMS.map((item: any) => {
                        // 1. Super Admin Only
                        if (item.adminOnly && userRole !== 'superadmin') return null;

                        // 2. Owner/Admin Only (for Team Management)
                        if (item.ownerOnly && userRole !== 'proprietario' && userRole !== 'superadmin') return null;

                        // 3. Module Permissions for Collaborators
                        if (userRole === 'colaborador' && item.module && !permissions[item.module]) {
                            return null;
                        }

                        const isActive = pathname.startsWith(item.href)

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                                    isActive ? "bg-[var(--secondary)] text-white" : "text-gray-300 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.name}
                            </Link>
                        )
                    })}
                </nav>

                {/* Ações Rápidas */}
                <div className="mt-8 px-6">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Ações Rápidas
                    </h4>
                    <div className="space-y-2">
                        <Link href="/planos-trabalho/novo" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
                            <Plus className="w-4 h-4 text-[var(--secondary)]" /> Novo Plano
                        </Link>
                        <Link href="/atividades/nova" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
                            <Plus className="w-4 h-4 text-[var(--secondary)]" /> Nova Atividade
                        </Link>
                        <Link href="/cursos/novo" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors">
                            <Plus className="w-4 h-4 text-[var(--secondary)]" /> Novo Curso
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer / User Info */}
            <div className="p-4 border-t border-white/10 bg-black/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--secondary)] flex items-center justify-center text-sm font-bold uppercase">
                        {userName.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{userName}</p>
                        <p className="text-xs text-gray-400 capitalize">{userRole}</p>
                    </div>
                </div>
            </div>
        </aside>
    )
}
