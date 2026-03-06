'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, User, Bot, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useChat, Message } from 'ai/react'

export function AIChat() {
    const [isOpen, setIsOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: '/api/chat',
        onError: (error: Error) => {
            console.error('Chat Error:', error)
        }
    })

    const pendingAlerts = messages.length > 0 ? 0 : 1 // Fake tooltip initial alert

    const toggleChat = () => setIsOpen(!isOpen)

    // Scroll automatically to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={toggleChat}
                className="fixed bottom-6 right-6 w-14 h-14 bg-[#1A3C4A] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#2E6B7A] transition-colors z-50 focus:outline-none"
            >
                <Sparkles className="w-6 h-6" />
                {!isOpen && pendingAlerts > 0 && (
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
                            <span className="text-[10px] bg-[#2E6B7A] border border-[#3e8294] px-2 py-0.5 rounded-full ml-2">GPT-4o</span>
                        </div>
                        <button onClick={toggleChat} className="text-gray-300 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* messages area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-3 px-6 animate-in fade-in duration-500">
                                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-2 shadow-inner border border-teal-100">
                                    <Sparkles className="w-8 h-8 text-[#2D9E6B]" />
                                </div>
                                <h3 className="font-bold text-gray-700 text-lg">Olá! Sou a Nexori AI.</h3>
                                <p className="text-sm">Posso ajudar você a redigir planos de trabalho, listar dicas e analisar projetos da instituição.</p>
                                <p className="text-xs text-gray-400 mt-4 bg-white p-2 border border-gray-100 rounded shadow-sm">
                                    Dica: <span className="font-semibold italic">"Crie um rascunho de plano de trabalho para ensinar basquete a jovens"</span>
                                </p>
                            </div>
                        ) : (
                            messages.map((msg: Message) => (
                                <div key={msg.id} className={clsx("flex w-full animate-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                    <div className={clsx(
                                        "max-w-[85%] p-3 text-sm shadow-sm relative",
                                        msg.role === 'user'
                                            ? "bg-[#1A3C4A] text-white rounded-2xl rounded-tr-sm"
                                            : "bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-sm ml-2"
                                    )}>
                                        {msg.role === 'assistant' && (
                                            <div className="absolute -left-3 -top-1 w-6 h-6 bg-[#2D9E6B] text-white flex items-center justify-center rounded-full shadow border-2 border-white">
                                                <Bot className="w-3 h-3" />
                                            </div>
                                        )}
                                        {/* Render Tool Calls (ações da API) se houver */}
                                        {msg.toolInvocations?.map((tool: any) => (
                                            <div key={tool.toolCallId} className="bg-blue-50 text-blue-800 p-2 rounded border border-blue-100 text-xs mb-2">
                                                {tool.toolName === 'gerarPlanoTrabalho' && (
                                                    <div className="flex items-center gap-1 font-semibold">
                                                        <Sparkles className="w-3 h-3 text-blue-600" />
                                                        Gerando Plano de Trabalho...
                                                    </div>
                                                )}
                                                {/* Exibe o resultado se a chamada da ferramenta já tiver concluído */}
                                                {'result' in tool && tool.result && typeof tool.result === 'object' && 'message' in tool.result && (
                                                    <div className="mt-1 text-green-700 font-medium border-t border-blue-200 pt-1">
                                                        {(tool.result as any).message}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                                    </div>
                                </div>
                            ))
                        )}
                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex justify-start animate-in fade-in">
                                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm ml-2 p-3 shadow-sm text-gray-400 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* input area */}
                    <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
                        <form onSubmit={handleSubmit} className="relative flex items-center">
                            <input
                                name="prompt"
                                type="text"
                                placeholder="Pergunte ou peça uma ação..."
                                className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2D9E6B] focus:border-transparent transition-all"
                                value={input}
                                onChange={handleInputChange}
                                disabled={isLoading}
                                autoComplete="off"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !input.trim()}
                                className="absolute right-2 p-2.5 bg-[#1A3C4A] text-white rounded-full hover:bg-[#2D9E6B] transition-colors disabled:opacity-50 disabled:hover:bg-[#1A3C4A]"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
