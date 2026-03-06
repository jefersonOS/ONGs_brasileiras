'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NovoProjetoPage() {
    const [nome, setNome] = useState('')
    const [descricao, setDescricao] = useState('')
    const [status, setStatus] = useState('ativo')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // Get the current user to find their tenant_id
        const { data: { user } } = await supabase.auth.getUser()
        const tenantId = user?.user_metadata?.tenant_id

        if (!tenantId) {
            // If testing without fully set tenants, fail gracefully or handle it.
            // The RLS policy might block insertion anyway.
            // Assuming user has tenant_id injected for now.
        }

        const { error: insertError } = await supabase.from('projetos').insert({
            tenant_id: tenantId, // Make sure to inject. If tenant_id isn't known here due to testing context, RLS will fail. 
            // Note: Real world we would rely on Postgres default fetching from JWT or set it here.
            nome,
            descricao,
            status
        })

        if (insertError) {
            console.error(insertError)
            setError(insertError.message)
            setLoading(false)
            return
        }

        router.push('/projetos')
        router.refresh()
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#1A3C4A]">Novo Projeto</h1>
                <p className="text-gray-500 mt-1">Cadastre um novo projeto na plataforma.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {error && (
                    <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded-md">
                        Erro: {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Projeto *</label>
                        <input
                            type="text"
                            required
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"
                            placeholder="Ex: Projeto Esperança"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"
                            rows={4}
                            placeholder="Descreva os objetivos principais do projeto..."
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]"
                        >
                            <option value="ativo">Ativo</option>
                            <option value="arquivado">Arquivado</option>
                        </select>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm bg-[#1A3C4A] text-white rounded-md hover:bg-[#2E6B7A] transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Salvando...' : 'Salvar Projeto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
