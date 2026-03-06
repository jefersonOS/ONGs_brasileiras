'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [tipo, setTipo] = useState('cidadao')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error: signUpError, data } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nome,
                    tipo,
                    role: tipo === 'cidadao' ? 'cidadao' : 'proprietario' // Simplified role attribution for registering
                }
            }
        })

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
            return
        }

        if (data.user) {
            // Here we could insert the user in the public.users table if not using a trigger.
            // For now, we will assume Supabase Auth Trigger will handle inserting to public.users.
            router.push('/login?message=Cadastro realizado, faça login.')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F7F8]">
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-[#1A3C4A]">Nexori</h1>
                    <p className="text-gray-500 mt-2">Crie sua conta</p>
                </div>

                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-100 rounded-md">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input
                            type="text"
                            required
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                    </div>
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo de Conta</label>
                        <select
                            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B] bg-white"
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value)}
                        >
                            <option value="cidadao">Cidadão (Portal Público)</option>
                            <option value="interno">ONG (Sistema Interno)</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 mt-4 text-white bg-[#1A3C4A] rounded-md hover:bg-[#2E6B7A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1A3C4A] disabled:opacity-50"
                    >
                        {loading ? 'Cadastrando...' : 'Cadastrar'}
                    </button>
                </form>

                <p className="text-sm text-center text-gray-600">
                    Já tem uma conta? <Link href="/login" className="text-[#2D9E6B] hover:underline">Faça login</Link>
                </p>
            </div>
        </div>
    )
}
