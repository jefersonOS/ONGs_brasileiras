'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Power, PowerOff } from 'lucide-react'

interface TenantStatusToggleProps {
    tenantId: string
    initialStatus: string
}

export function TenantStatusToggle({ tenantId, initialStatus }: TenantStatusToggleProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const isActive = initialStatus === 'active'

    const handleToggle = async () => {
        if (!confirm(`Deseja realmente ${isActive ? 'desativar' : 'ativar'} esta instituição?`)) {
            return
        }

        setLoading(true)
        try {
            const nextStatus = isActive ? 'inactive' : 'active'
            const res = await fetch(`/api/backoffice/tenants/${tenantId}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao atualizar status')
            }

            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`p-3 rounded-xl transition-all shadow-lg flex items-center gap-2 group ${isActive
                ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-red-500/10'
                : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white shadow-green-500/10'
                }`}
            title={isActive ? 'Desativar Instituição' : 'Ativar Instituição'}
        >
            {isActive ? (
                <PowerOff className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
            ) : (
                <Power className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
            )}
            <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover:block transition-all">
                {isActive ? 'Suspender' : 'Ativar'}
            </span>
        </button>
    )
}
