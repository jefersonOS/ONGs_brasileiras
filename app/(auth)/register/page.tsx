'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Sparkles, UserPlus, Info, Building2 } from 'lucide-react'

function formatCPF(value: string) {
    return value
        .replace(/\D/g, '')
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatWhatsApp(value: string) {
    return value
        .replace(/\D/g, '')
        .slice(0, 11)
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

function RegisterForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const perfil = searchParams.get('perfil')
    const redirectAfter = searchParams.get('redirect')
    const tenantIdParam = searchParams.get('tenantId')
    const forceCidadao = perfil === 'cidadao'

    const [nome, setNome] = useState('')
    const [email, setEmail] = useState('')
    const [cpf, setCpf] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [password, setPassword] = useState('')
    const [tipo, setTipo] = useState('cidadao')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [inviteData, setInviteData] = useState<any>(null)
    const [tenantNome, setTenantNome] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const isCidadao = tipo === 'cidadao' || forceCidadao

    useEffect(() => {
        if (token) {
            const fetchInvite = async () => {
                const { data } = await supabase
                    .from('convites_equipe')
                    .select('*, tenant:tenants(nome)')
                    .eq('token', token)
                    .single()

                if (data) {
                    setInviteData(data)
                    setTipo('interno')
                    if (data.email) setEmail(data.email)
                }
            }
            fetchInvite()
        }
    }, [token, supabase])

    useEffect(() => {
        if (tenantIdParam && isCidadao) {
            supabase
                .from('tenants')
                .select('nome')
                .eq('id', tenantIdParam)
                .single()
                .then(({ data }) => { if (data) setTenantNome(data.nome) })
        }
    }, [tenantIdParam, isCidadao, supabase])

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const finalRole = token ? 'colaborador' : (tipo === 'cidadao' ? 'cidadao' : 'proprietario')
        const finalTenantId = token ? inviteData?.tenant_id : (tenantIdParam || null)
        const finalPermissions = token ? inviteData?.permissoes : {}

        const { error: signUpError, data } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nome,
                    tipo: token ? 'interno' : tipo,
                    role: finalRole,
                    tenant_id: finalTenantId,
                    permissoes: finalPermissions,
                    cpf: cpf.replace(/\D/g, '') || undefined,
                    whatsapp: whatsapp.replace(/\D/g, '') || undefined,
                }
            }
        })

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
            return
        }

        if (data.user) {
            if (token) {
                await supabase
                    .from('convites_equipe')
                    .update({ status: 'aceito' })
                    .eq('token', token)
            }

            // Login automático após cadastro
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
            if (signInError) {
                router.push('/login?message=Cadastro realizado! Faça login para continuar.')
                return
            }

            // Salvar CPF e WhatsApp na tabela users (para cidadãos)
            if (isCidadao && (cpf || whatsapp)) {
                await supabase.from('users').update({
                    cpf: cpf.replace(/\D/g, '') || null,
                    whatsapp: whatsapp.replace(/\D/g, '') || null,
                }).eq('id', data.user.id)
            }

            const dest = redirectAfter || (tipo === 'cidadao' ? '/minha-area' : '/dashboard')
            router.push(dest)
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen items-center justify-center bg-[#F5F7F8] flex p-6">
            <div className="w-full max-w-lg p-12 space-y-8 bg-white rounded-[50px] shadow-2xl border border-gray-50 animate-in zoom-in-95 duration-700">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-[#1A3C4A] text-white rounded-[24px] flex items-center justify-center mx-auto shadow-xl shadow-blue-900/10 mb-4">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-[#1A3C4A] tracking-tighter italic">Nexori</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest leading-loose">
                        {token ? 'Finalizando seu convite de equipe' : 'Crie sua conta gratuitamente'}
                    </p>
                </div>

                {tenantNome && !token && (
                    <div className="bg-[#1A3C4A]/5 p-5 rounded-[24px] border border-[#1A3C4A]/10 flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-[#1A3C4A]" />
                        <p className="text-xs font-bold text-[#1A3C4A]">Cadastro para o portal de <span className="font-black">{tenantNome}</span></p>
                    </div>
                )}

                {inviteData && (
                    <div className="bg-green-50 p-6 rounded-[30px] border border-green-100 flex items-start gap-4">
                        <UserPlus className="w-5 h-5 text-green-600 mt-1" />
                        <div>
                            <p className="text-xs font-black text-[#1A3C4A]">Convite Confirmado!</p>
                            <p className="text-[10px] text-green-700 font-medium">Você está se juntando à equipe da <strong>{inviteData.tenant?.nome}</strong>.</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 text-xs font-bold text-red-600 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                        <Info className="w-4 h-4" /> {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Nome Completo</label>
                        <input
                            type="text"
                            required
                            placeholder="Seu nome completo"
                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#2D9E6B]/20 transition-all outline-none"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">E-mail</label>
                        <input
                            type="email"
                            required
                            disabled={!!(token && inviteData?.email)}
                            placeholder="seu@email.com"
                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#2D9E6B]/20 transition-all outline-none disabled:opacity-50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {isCidadao && !token && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">CPF</label>
                                <input
                                    type="text"
                                    placeholder="000.000.000-00"
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#2D9E6B]/20 transition-all outline-none"
                                    value={cpf}
                                    onChange={(e) => setCpf(formatCPF(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">WhatsApp</label>
                                <input
                                    type="text"
                                    placeholder="(00) 00000-0000"
                                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#2D9E6B]/20 transition-all outline-none"
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Senha</label>
                        <input
                            type="password"
                            required
                            placeholder="Mínimo 6 caracteres"
                            minLength={6}
                            className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#2D9E6B]/20 transition-all outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    {!token && !forceCidadao && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Tipo de Perfil</label>
                            <select
                                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-black uppercase tracking-tight focus:ring-2 focus:ring-[#2D9E6B]/20 transition-all outline-none appearance-none"
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                            >
                                <option value="cidadao">Cidadão (Portal Público)</option>
                                <option value="interno">ONG (Gestão Interna)</option>
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 text-white bg-[#1A3C4A] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2E6B7A] transition-all shadow-xl shadow-blue-900/10 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Criando conta...' : 'Criar Conta'}
                    </button>
                </form>

                <div className="border-t border-gray-100 pt-6 space-y-2">
                    <p className="text-sm font-bold text-center text-gray-700">Já possui cadastro?</p>
                    <Link
                        href={redirectAfter ? `/login?redirect=${encodeURIComponent(redirectAfter)}` : '/login'}
                        className="block w-full text-center py-4 border-2 border-[#1A3C4A] text-[#1A3C4A] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1A3C4A] hover:text-white transition-all"
                    >
                        Entrar na minha conta
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="min-h-screen items-center justify-center bg-[#F5F7F8] flex p-6 animate-pulse text-[10px] font-black uppercase tracking-widest text-[#1A3C4A]">Carregando...</div>}>
            <RegisterForm />
        </Suspense>
    )
}
