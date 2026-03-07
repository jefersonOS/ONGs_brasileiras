'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Zap, Shield } from 'lucide-react'

interface TenantPlanSelectorProps {
    tenantId: string
    currentPlan: string
}

const PLANOS = [
    { id: 'free', label: 'Gratuito', icon: Zap, color: 'text-gray-400', bg: 'bg-gray-50' },
    { id: 'pro', label: 'Pro / Mensal', icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'enterprise', label: 'Corporativo', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' }
]

export function TenantPlanSelector({ tenantId, currentPlan }: TenantPlanSelectorProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handlePlanChange = async (newPlan: string) => {
        if (newPlan === currentPlan) return
        if (!confirm(`Deseja alterar o plano desta instituição para ${newPlan.toUpperCase()}?`)) return

        setLoading(true)
        try {
            const res = await fetch(`/api/backoffice/tenants/${tenantId}/plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plano: newPlan })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao atualizar plano')
            }

            router.refresh()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative group">
            <select
                value={currentPlan}
                disabled={loading}
                onChange={(e) => handlePlanChange(e.target.value)}
                className={`appearance-none px-4 py-2 pr-10 rounded-full text-[9px] font-black uppercase tracking-widest italic cursor-pointer transition-all outline-none border border-transparent hover:border-blue-200
                    ${currentPlan === 'enterprise' ? 'bg-purple-50 text-purple-600' :
                        currentPlan === 'pro' ? 'bg-blue-50 text-blue-600' :
                            'bg-gray-100 text-gray-500'}`}
            >
                {PLANOS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                ))}
            </select>
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${loading ? 'animate-spin' : ''}`}>
                {PLANOS.find(p => p.id === currentPlan)?.icon && (
                    <div className={PLANOS.find(p => p.id === currentPlan)?.color}>
                        {(() => {
                            const Icon = PLANOS.find(p => p.id === currentPlan)!.icon
                            return <Icon className="w-3 h-3" />
                        })()}
                    </div>
                )}
            </div>
        </div>
    )
}
