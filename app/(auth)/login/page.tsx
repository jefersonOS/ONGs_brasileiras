'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        // Checking user metadata to redirect appropriately
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.tipo === 'cidadao') {
            router.push('/minha-area')
        } else {
            router.push('/dashboard')
        }
        router.refresh()
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F7F8]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-[#1A3C4A]">Nexori</h1>
                    <p className="text-gray-500 mt-2">Faça o login em sua conta</p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-100 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Senha</label>
                        <input
                            type="password"
                            required
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 text-white bg-[#1A3C4A] rounded-md hover:bg-[#2E6B7A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A3C4A] disabled:opacity-50"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-600">
                    Não tem uma conta? <Link href="/register" className="text-[#2D9E6B] hover:underline">Registre-se</Link>
                </p>
            </div>
        </div>
    )
}
