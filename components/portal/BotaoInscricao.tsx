'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface BotaoInscricaoProps {
    tipo: 'curso' | 'atividade'
    entidadeId: string
    turmaId?: string
    isEnrolled: boolean
    inscricaoId?: string
    hasVacancies: boolean
    isLogged: boolean
}

export function BotaoInscricao({
    tipo,
    entidadeId,
    turmaId,
    isEnrolled,
    inscricaoId,
    hasVacancies,
    isLogged
}: BotaoInscricaoProps) {
    const [loading, setLoading] = useState(false)

    const handleCancel = async () => {
        if (!confirm('Tem certeza que deseja cancelar sua participação?')) return
        setLoading(true)
        try {
            const res = await fetch('/api/inscricao/cancelar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inscricaoId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao processar')
            window.location.reload()
        } catch {
            alert('Falha ao processar solicitação.')
        } finally {
            setLoading(false)
        }
    }

    if (isEnrolled) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-black uppercase">Você já está inscrito</span>
                </div>
                <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="w-full py-3 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-2 border border-red-50"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4" /> Cancelar Inscrição</>}
                </button>
            </div>
        )
    }

    if (!hasVacancies) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-3 rounded-xl border border-amber-100">
                    <span className="text-sm font-black uppercase">Vagas Esgotadas</span>
                </div>
                <button
                    disabled
                    className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-xs tracking-widest cursor-not-allowed"
                >
                    Entrar na Lista de Espera (Em breve)
                </button>
            </div>
        )
    }

    const href = isLogged
        ? `/inscricao/${tipo}/${entidadeId}${turmaId ? `?turma=${turmaId}` : ''}`
        : `/login?redirectTo=/cursos/${entidadeId}` // Simplificado

    return (
        <Link
            href={href}
            className="block w-full text-center py-4 bg-[var(--primary)] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[var(--secondary)] transition-all shadow-xl shadow-[var(--primary)]/20"
        >
            Inscrever-se Agora
        </Link>
    )
}
