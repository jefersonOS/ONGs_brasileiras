'use client'

import { useState } from 'react'
import { Plus, X, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function MovimentacaoModal({ bemId, currentLocal, tenantId }: { bemId: string, currentLocal: string, tenantId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [para, setPara] = useState('')
    const [tipo] = useState('transferencia')
    const [motivo, setMotivo] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/patrimonio/movimentacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bemId,
                    tipo,
                    de: currentLocal,
                    para,
                    motivo,
                    tenantId
                })
            })

            if (!res.ok) throw new Error('Erro ao registrar movimentação')

            setIsOpen(false)
            router.refresh()
        } catch {
            alert('Erro ao salvar movimentação')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-[#1A3C4A] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
            >
                <Plus className="w-4 h-4" /> Registrar Movimentação
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="bg-[#1A3C4A] p-8 text-white relative">
                            <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                            <h2 className="text-2xl font-black">Nova Movimentação</h2>
                            <p className="text-white/60 text-sm mt-1">Registre a transferência deste bem.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase text-gray-400">Origem</p>
                                    <p className="text-sm font-bold text-gray-800">{currentLocal || 'Não definida'}</p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-300" />
                                <div className="flex-1 text-right">
                                    <p className="text-[10px] font-black uppercase text-gray-400">Tipo</p>
                                    <p className="text-sm font-bold text-[#2D9E6B] capitalize">{tipo}</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Destino / Nova Localização *</label>
                                <input
                                    type="text"
                                    value={para}
                                    onChange={e => setPara(e.target.value)}
                                    required
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2D9E6B] focus:outline-none transition-all"
                                    placeholder="Ex: Almoxarifado Central"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2">Motivo da Movimentação</label>
                                <textarea
                                    value={motivo}
                                    onChange={e => setMotivo(e.target.value)}
                                    rows={2}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#2D9E6B] focus:outline-none transition-all"
                                    placeholder="Ex: Manutenção preventiva..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !para}
                                className="w-full bg-[#2D9E6B] text-white py-4 rounded-2xl font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-900/20 disabled:opacity-50"
                            >
                                {loading ? 'Processando...' : 'Confirmar Movimentação'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
