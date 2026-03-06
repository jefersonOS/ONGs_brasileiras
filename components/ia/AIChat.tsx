'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Check, Plus } from 'lucide-react'
import { clsx } from 'clsx'
import { useChat } from 'ai/react'
import type { Message } from 'ai'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AIActionCard({ action, onConfirm, onCancel }: { action: any, onConfirm: () => void, onCancel: () => void }) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

    const handleConfirm = async () => {
        setStatus('loading')
        try {
            const res = await fetch('/api/ia/executar-acao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(action)
            })
            if (res.ok) setStatus('success')
            else setStatus('error')
            onConfirm()
        } catch {
            setStatus('error')
        }
    }

    if (status === 'success') {
        return (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-2 text-green-700 text-xs my-2 animate-in zoom-in-95">
                <Check className="w-4 h-4" /> Ação executada com sucesso!
            </div>
        )
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 my-2 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-teal-50 rounded-lg text-[#2D9E6B]">
                    <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-gray-800">{action.titulo || 'Sugestão de Ação'}</h4>
            </div>
            <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                {action.tipo === 'criar_plano' ? 'Gerar rascunho de plano de trabalho com os dados sugeridos.' : 'Executar ação recomendada pela IA.'}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleConfirm}
                    disabled={status === 'loading'}
                    className="flex-1 bg-[#1A3C4A] text-white py-2 rounded-lg text-xs font-bold hover:bg-[#2E6B7A] transition-colors disabled:opacity-50"
                >
                    {status === 'loading' ? 'Executando...' : 'Confirmar'}
                </button>
                <button
                    onClick={onCancel}
                    className="px-3 bg-gray-50 text-gray-600 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 border border-gray-200"
                >
                    Cancelar
                </button>
            </div>
        </div>
    )
}

export function AIChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [unreadAlerts, setUnreadAlerts] = useState(0)
    const pathname = usePathname()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
        api: '/api/ia/chat',
        body: { paginaAtual: pathname },
        onError: (error: Error) => console.error('Chat Error:', error)
    })

    useEffect(() => {
        const fetchAlertsCount = async () => {
            const { count } = await supabase.from('ia_acoes_pendentes').select('*', { count: 'exact', head: true }).eq('status', 'pendente')
            setUnreadAlerts(count || 0)
        }
        fetchAlertsCount()
    }, [isOpen, supabase])

    const toggleChat = () => setIsOpen(!isOpen)

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const parseJSONAction = (content: string) => {
        try {
            const jsonMatch = content.match(/\{[\s\S]*"acao":\s*true[\s\S]*\}/)
            if (jsonMatch) return JSON.parse(jsonMatch[0])
        } catch { return null }
        return null
    }

    const CONTEXTUAL_BUTTONS: Record<string, { label: string, prompt: string }[]> = {
        '/planos-trabalho': [
            { label: 'Gerar novo plano', prompt: 'Gere uma sugestão de plano de trabalho para mim.' },
            { label: 'Analisar prazos', prompt: 'Quais são meus prazos mais urgentes?' }
        ],
        '/atividades': [
            { label: 'Nova atividade', prompt: 'Sugira uma nova atividade cultural para este mês.' }
        ],
        '/dashboard': [
            { label: 'O que está pendente?', prompt: 'Resuma minhas ações pendentes hoje.' }
        ]
    }

    const currentButtons = CONTEXTUAL_BUTTONS[pathname] || CONTEXTUAL_BUTTONS['/dashboard']

    return (
        <>
            <button
                onClick={toggleChat}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#1A3C4A] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#2E6B7A] transition-colors z-50 focus:outline-none"
            >
                <Sparkles className="w-6 h-6" />
                {!isOpen && unreadAlerts > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">
                        {unreadAlerts}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[420px] h-[650px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-5">
                    <div className="h-16 bg-[#1A3C4A] flex items-center justify-between px-6 text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#2D9E6B] p-2 rounded-lg">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="font-bold block leading-none">Nexori AI</span>
                                <span className="text-[10px] text-gray-400">Inteligência Estratégica</span>
                            </div>
                        </div>
                        <button onClick={toggleChat} className="text-gray-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-hide">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="font-bold text-gray-800">Olá! Como posso ajudar?</h3>
                                    <p className="text-sm text-gray-500 mt-2">Eu conheço os projetos, prazos e métricas da sua instituição.</p>
                                </div>
                                <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                                    {currentButtons.map(btn => (
                                        <button
                                            key={btn.label}
                                            onClick={() => append({ role: 'user', content: btn.prompt })}
                                            className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-semibold hover:border-[#2D9E6B] hover:text-[#2D9E6B] transition-all flex items-center justify-between group"
                                        >
                                            {btn.label}
                                            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg: Message) => {
                                const action = msg.role === 'assistant' ? parseJSONAction(msg.content) : null
                                const cleanContent = action ? msg.content.replace(/\{[\s\S]*"acao":\s*true[\s\S]*\}/, '').trim() : msg.content

                                return (
                                    <div key={msg.id} className={clsx("flex w-full animate-in slide-in-from-bottom-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                        <div className={clsx(
                                            "max-w-[85%] rounded-2xl p-4 text-sm shadow-sm relative",
                                            msg.role === 'user' ? "bg-[#1A3C4A] text-white" : "bg-white border border-gray-200 text-gray-800"
                                        )}>
                                            {cleanContent && <div className="whitespace-pre-wrap leading-relaxed">{cleanContent}</div>}
                                            {action && <AIActionCard action={action} onConfirm={() => { }} onCancel={() => { }} />}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        {isLoading && <div className="flex items-center gap-2 p-4 text-xs text-gray-400 italic">Digitando...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                        <form onSubmit={handleSubmit} className="relative flex items-center">
                            <input
                                placeholder="Descreva o que você precisa..."
                                className="w-full pl-6 pr-14 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#2D9E6B] transition-all"
                                value={input}
                                onChange={handleInputChange}
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 p-3 bg-[#1A3C4A] text-white rounded-xl hover:bg-[#2D9E6B] transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
