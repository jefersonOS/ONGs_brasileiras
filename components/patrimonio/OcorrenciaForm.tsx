'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export function OcorrenciaForm({ tombamento }: { tombamento: string }) {
    const [descricao, setDescricao] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/patrimonio/ocorrencia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tombamento, descricao })
            })

            if (!res.ok) throw new Error('Falha ao enviar relato')

            setSuccess(true)
            setDescricao('')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 text-center animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h4 className="font-bold text-green-800">Relato Enviado!</h4>
                <p className="text-xs text-green-600 mt-1">Nossa equipe técnica foi notificada e analisará o problema em breve.</p>
                <button onClick={() => setSuccess(false)} className="mt-4 text-xs font-bold text-green-700 underline">Enviar outro relato</button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-100 text-red-600 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                </div>
            )}
            <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                required
                className="w-full bg-white border border-red-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-red-200 focus:outline-none transition-all"
                rows={3}
                placeholder="Descreva o problema aqui..."
            ></textarea>
            <button
                type="submit"
                disabled={loading || !descricao}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 disabled:opacity-50"
            >
                {loading ? 'Enviando...' : 'Enviar Relato de Defeito'}
            </button>
        </form>
    )
}
