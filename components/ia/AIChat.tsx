'use client'

import { useState } from 'react'
import { Sparkles, X, Send } from 'lucide-react'
import { clsx } from 'clsx'

export function AIChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])

    const pendingAlerts = 2 // Mock, soon we will fetch from Supabase

    const toggleChat = () => setIsOpen(!isOpen)

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim()) return

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: message }])
        const currentMsg = message
        setMessage('')

        // Simulate AI response (since we don't have the API route yet)
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Simulação de resposta da IA para: "${currentMsg}". A API será conectada futuramente.`
            }])
        }, 1000)
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={toggleChat}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#1A3C4A] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#2E6B7A] transition-colors z-50 focus:outline-none"
            >
                <Sparkles className="w-6 h-6" />
                {pendingAlerts > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">
                        {pendingAlerts}
                    </span>
                )}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200">
                    {/* header */}
                    <div className="h-14 bg-[#1A3C4A] flex items-center justify-between px-4 text-white">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-[#2D9E6B]" />
                            <span className="font-semibold">Assistente IA</span>
                            <span className="text-[10px] bg-[#2E6B7A] px-2 py-0.5 rounded-full ml-2">GPT-4o</span>
                        </div>
                        <button onClick={toggleChat} className="text-gray-300 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* messages area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-3">
                                <Sparkles className="w-8 h-8 text-gray-300" />
                                <p className="text-sm">Olá! Sou sua assistente virtual.<br />Como posso ajudar com seus projetos hoje?</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={clsx("flex w-full", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                    <div className={clsx(
                                        "max-w-[80%] p-3 rounded-lg text-sm",
                                        msg.role === 'user'
                                            ? "bg-[#1A3C4A] text-white rounded-br-none"
                                            : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* input area */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <form onSubmit={handleSend} className="relative">
                            <input
                                type="text"
                                placeholder="Pergunte ou peça uma ação..."
                                className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#2D9E6B] focus:border-transparent"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!message.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#2D9E6B] text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
