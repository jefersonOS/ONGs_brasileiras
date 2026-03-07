'use client'

import { ShieldAlert, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ContaSuspensa() {
    const supabase = createClient()
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="bg-white max-w-md w-full rounded-[40px] shadow-2xl p-10 text-center space-y-6 border border-red-50">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-10 h-10" />
                </div>

                <h1 className="text-3xl font-black text-[#1A3C4A] tracking-tighter italic">Acesso Restrito</h1>

                <p className="text-gray-500 text-sm leading-relaxed">
                    A conta desta instituição encontra-se temporariamente <span className="text-red-600 font-bold uppercase">suspensa</span>.
                    Isso geralmente ocorre devido a pendências financeiras ou expiração do plano de assinatura.
                </p>

                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest leading-tight">
                        Por favor, entre em contato com o administrador da sua organização ou com o suporte oficial da Nexori para regularizar a situação.
                    </p>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full py-4 bg-[#1A3C4A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2E6B7A] transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-900/10"
                >
                    <LogOut className="w-4 h-4" /> Sair do Sistema
                </button>
            </div>
        </div>
    )
}
