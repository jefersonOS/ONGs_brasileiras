'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    ShieldCheck, ArrowRight,
    Building2, Lock, Sparkles
} from 'lucide-react'
import Link from 'next/link'

export default function AceitarConvitePage({ params }: { params: { token: string } }) {
    const { token } = params
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [convite, setConvite] = useState<any>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        const checkInvite = async () => {
            const { data, error } = await supabase
                .from('convites_equipe')
                .select('*, tenant:tenants(nome)')
                .eq('token', token)
                .eq('status', 'pendente')
                .single()

            if (error || !data) {
                setError('Este convite é inválido ou já foi utilizado.')
            } else {
                // Verificar expiração
                if (new Date(data.expira_em) < new Date()) {
                    setError('Este convite expirou.')
                } else {
                    setConvite(data)
                }
            }
            setLoading(false)
        }
        checkInvite()
    }, [token, supabase])

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 animate-pulse text-[10px] font-black uppercase tracking-widest text-gray-400italic">Validando convite...</div>

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white max-w-md w-full rounded-[40px] shadow-2xl p-10 text-center space-y-6 border border-red-50">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
                        <Lock className="w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-[#1A3C4A] tracking-tighter italic">Link Inválido</h1>
                    <p className="text-gray-500 text-sm leading-relaxed">{error}</p>
                    <Link href="/login" className="block w-full py-4 bg-[#1A3C4A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2E6B7A] transition-all shadow-xl shadow-blue-900/10">
                        Ir para o Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#1A3C4A] flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
            <div className="bg-white max-w-xl w-full rounded-[50px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-700">
                <div className="p-12 text-center space-y-8">
                    <div className="w-24 h-24 bg-green-50 text-[#2D9E6B] rounded-[40px] flex items-center justify-center mx-auto shadow-2xl shadow-green-600/10 active:scale-95 transition-transform cursor-pointer">
                        <Sparkles className="w-12 h-12" />
                    </div>

                    <div>
                        <h1 className="text-4xl font-black text-[#1A3C4A] tracking-tighter italic leading-none">Você foi convidado!</h1>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-3">Novo Colaborador Nexori</p>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-[35px] border border-gray-100 space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <Building2 className="w-5 h-5 text-blue-500" />
                            <p className="text-xl font-black text-[#1A3C4A] tracking-tight">{convite.tenant?.nome}</p>
                        </div>
                        <p className="text-gray-500 text-sm italic">&quot;A sua organização está chamando você para colaborar na plataforma.&quot;</p>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Acessos que você terá:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {Object.entries(convite.permissoes).filter(([, val]) => val).map(([key]) => (
                                <span key={key} className="px-4 py-2 bg-[#1A3C4A]/5 text-[#1A3C4A] rounded-full text-[10px] font-black uppercase tracking-tighter">
                                    {key.replace('_', ' ')}
                                </span>
                            ))}
                        </div>
                    </div>

                    <Link
                        href={`/register?token=${token}&tenant=${convite.tenant_id}`}
                        className="group w-full py-6 bg-[#2D9E6B] text-white rounded-[25px] text-xs font-black uppercase tracking-[0.2em] hover:bg-green-600 transition-all shadow-2xl shadow-green-600/30 flex items-center justify-center gap-3"
                    >
                        Criar minha conta <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <p className="text-[10px] text-gray-400 font-medium">
                        Já tem uma conta? <Link href="/login" className="text-[#1A3C4A] font-black hover:underline">Faça login aqui</Link>
                    </p>
                </div>

                <div className="bg-gray-50 p-6 text-center border-t border-gray-100">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic flex items-center justify-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-[#2D9E6B]" /> Ambiente Seguro & Criptografado
                    </p>
                </div>
            </div>
        </div>
    )
}
