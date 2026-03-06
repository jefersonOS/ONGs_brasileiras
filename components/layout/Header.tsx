'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut, Bell } from 'lucide-react'

export function Header() {
    const supabase = createClient()
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <header className="h-[60px] bg-white border-b border-gray-200 fixed top-0 right-0 left-[220px] flex items-center justify-between px-8 z-10">
            <div className="flex items-center gap-4">
                {/* Placeholder for Breadcrumb */}
                <span className="text-sm font-medium text-gray-500">Sistema Interno</span>
            </div>

            <div className="flex items-center gap-6">
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
