'use client'

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [status, setStatus] = useState<Status>('idle')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) return

        setStatus('loading')
        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message.trim() }),
            })
            if (!res.ok) throw new Error('Request failed')
            setStatus('success')
            setMessage('')
            setTimeout(() => {
                setIsOpen(false)
                setStatus('idle')
            }, 2000)
        } catch {
            setStatus('error')
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        setMessage('')
        setStatus('idle')
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#2D9E6B] transition-colors"
                aria-label="Enviar feedback"
            >
                <MessageSquare className="w-4 h-4" />
                Feedback
            </button>

            {isOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="feedback-title"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                >
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 id="feedback-title" className="text-base font-semibold text-[#1A3C4A]">
                                Enviar Feedback
                            </h2>
                            <button
                                onClick={handleClose}
                                aria-label="Fechar"
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {status === 'success' ? (
                            <p className="text-center text-[#2D9E6B] font-medium py-4">
                                Obrigado pelo seu feedback!
                            </p>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Descreva sua sugestão, dúvida ou problema..."
                                    rows={4}
                                    maxLength={1000}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#2D9E6B]"
                                    aria-label="Mensagem de feedback"
                                />
                                {status === 'error' && (
                                    <p role="alert" className="text-red-500 text-sm mt-2">
                                        Ocorreu um erro. Tente novamente.
                                    </p>
                                )}
                                <div className="flex justify-end mt-4">
                                    <button
                                        type="submit"
                                        disabled={status === 'loading' || !message.trim()}
                                        className="bg-[#2D9E6B] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#268a5c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {status === 'loading' ? 'Enviando...' : 'Enviar'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
