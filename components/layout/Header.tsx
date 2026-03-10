'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Bell } from 'lucide-react'
import { FeedbackButton } from '@/components/ui/FeedbackButton'

export function Header() {
    const supabase = createClient()
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const pathname = usePathname()

    const getPageTitle = (path: string) => {
        const map: Record<string, string> = {
            '/dashboard': 'Painel de Controle',
            '/backoffice': 'Gestão Global (Backoffice)',
            '/projetos': 'Centro de Projetos',
            '/planos-trabalho': 'Planos de Trabalho',
            '/prestacoes-contas': 'Prestações de Contas',
            '/atividades': 'Eventos e Atividades',
            '/cursos': 'Gestão de Cursos e Turmas',
            '/patrimonio': 'Controle de Patrimônio',
            '/logs-auditoria': 'Auditoria e Segurança',
            '/configuracoes': 'Configurações da ONG'
        }
        // Match base routes
        const base = Object.keys(map).find(route => path.startsWith(route))
        return base ? map[base] : 'Sistema Interno'
    }

    return (
        <header className="h-[60px] bg-white border-b border-gray-200 fixed top-0 right-0 left-[220px] flex items-center justify-between px-8 z-10">
            <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-[#1A3C4A]">
                    {getPageTitle(pathname)}
                </span>
            </div>

            <div className="flex items-center gap-6">
                <FeedbackButton />

                <button className="relative text-gray-500 hover:text-gray-700">
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2D9E6B] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2D9E6B]"></span>
                    </span>
                </button>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sair
                </button>
            </div>
        </header>
    )
}
