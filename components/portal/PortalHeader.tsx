'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User as UserIcon, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface PortalHeaderProps {
    tenantName: string
}

export function PortalHeader({ tenantName }: PortalHeaderProps) {
    const [user, setUser] = useState<any>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user))
    }, [supabase.auth])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        router.push('/')
        router.refresh()
    }

    return (
        <header className="h-[70px] bg-[var(--primary)] text-white flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50 shadow-md">
            <Link href="/" className="font-black text-2xl flex items-center gap-2 tracking-tighter">
                {tenantName} <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded ml-2">Portal</span>
            </Link>

            <nav className="flex items-center gap-6">
                <Link href="/" className="text-sm font-bold opacity-80 hover:opacity-100 transition-opacity">Início</Link>
                {user ? (
                    <div className="flex items-center gap-4 ml-4 pl-4 border-l border-white/10">
                        <Link href="/minha-area" className="flex items-center gap-2 text-sm font-bold bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition-all">
                            <UserIcon className="w-4 h-4" /> Minha Área
                        </Link>
                        <button onClick={handleLogout} className="opacity-60 hover:opacity-100 hover:text-red-300 transition-all">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
                        <Link href="/login" className="text-sm font-bold opacity-80 hover:opacity-100 transition-opacity">Entrar</Link>
                        <Link href="/register" className="text-sm bg-white text-[var(--primary)] px-5 py-2 rounded-xl font-black uppercase hover:bg-gray-100 transition-all shadow-lg shadow-black/10">
                            Cadastro
                        </Link>
                    </div>
                )}
            </nav>
        </header>
    )
}
