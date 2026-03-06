'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [user, setUser] = useState<any>(null)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user))
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        router.push('/')
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#F5F7F8]">
            <header className="h-[60px] bg-[#1A3C4A] text-white flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
                <Link href="/" className="font-bold text-xl flex items-center gap-2">
                    Nexori <span className="text-sm font-normal text-gray-300 hidden sm:inline-block">Portal do Cidadão</span>
                </Link>

                <nav className="flex items-center gap-4">
                    <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors">Início</Link>
                    {user ? (
                        <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[#2E6B7A]">
                            <Link href="/minha-area" className="flex items-center gap-2 text-sm text-white hover:text-[#2D9E6B] transition-colors">
                                <User className="w-4 h-4" /> Minha Área
                            </Link>
                            <button onClick={handleLogout} className="text-gray-300 hover:text-red-400">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 ml-4 pl-4 border-l border-[#2E6B7A]">
                            <Link href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">Entrar</Link>
                            <Link href="/register" className="text-sm bg-[#2D9E6B] text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors">Cadastro</Link>
                        </div>
                    )}
                </nav>
            </header>

            <main className="flex-1">
                {children}
            </main>

            <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Nexori SaaS. Todos os direitos reservados.
            </footer>
        </div>
    )
}
