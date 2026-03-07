'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Users, UserPlus, Check,
    Copy, Mail, ChevronRight,
    Lock, CheckCircle2, XCircle
} from 'lucide-react'

const MODULOS = [
    { id: 'dashboard', nome: 'Dashboard & Geral' },
    { id: 'planos_trabalho', nome: 'Planos de Trabalho' },
    { id: 'prestacoes_contas', nome: 'Prestação de Contas' },
    { id: 'patrimonio', nome: 'Gestão de Patrimônio' },
    { id: 'atividades', nome: 'Projetos & Atividades' },
    { id: 'configuracoes', nome: 'Configurações de Nexo' }
]

export default function GestaoEquipePage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [team, setTeam] = useState<any[]>([])
    const [invites, setInvites] = useState<any[]>([])
    const [showInviteModal, setShowInviteModal] = useState(false)

    // Form de Convite
    const [inviteEmail, setInviteEmail] = useState('')
    const [permissions, setPermissions] = useState<Record<string, boolean>>(
        MODULOS.reduce((acc, m) => ({ ...acc, [m.id]: true }), {})
    )
    const [generatedLink, setGeneratedLink] = useState('')

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const tenantId = user.user_metadata?.tenant_id

        const [usersRes, invitesRes] = await Promise.all([
            supabase.from('users').select('*').eq('tenant_id', tenantId),
            supabase.from('convites_equipe').select('*').eq('tenant_id', tenantId).eq('status', 'pendente')
        ])

        setTeam(usersRes.data || [])
        setInvites(invitesRes.data || [])
        setLoading(false)
    }, [supabase])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleCreateInvite = async () => {
        try {
            const res = await fetch('/api/equipe/convidar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: inviteEmail, permissoes: permissions })
            })
            const data = await res.json()
            if (data.inviteLink) {
                setGeneratedLink(data.inviteLink)
                fetchData()
            }
        } catch (err) {
            console.error(err)
        }
    }

    const togglePermission = (id: string) => {
        setPermissions(prev => ({ ...prev, [id]: !prev[id] }))
    }

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-400 font-black uppercase text-xs">Carregando equipe...</div>

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-[#1A3C4A] tracking-tighter">Minha Equipe</h1>
                    <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2">Gerencie colaboradores e permissões granulares</p>
                </div>
                <button
                    onClick={() => {
                        setShowInviteModal(true)
                        setGeneratedLink('')
                    }}
                    className="bg-[#2D9E6B] text-white px-6 py-4 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-green-600/20 text-[10px] font-black uppercase tracking-widest"
                >
                    <UserPlus className="w-4 h-4" /> Convidar Colaborador
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 space-y-8">
                    {/* Lista de Membros */}
                    <div className="bg-white rounded-[40px] shadow-2xl shadow-black/5 border border-gray-50 overflow-hidden">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
                            <Users className="w-5 h-5 text-blue-500" />
                            <h2 className="text-sm font-black uppercase tracking-widest text-[#1A3C4A]">Colaboradores Ativos ({team.length})</h2>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {team.map(member => (
                                <div key={member.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#1A3C4A] text-white flex items-center justify-center font-black">
                                            {member.nome?.charAt(0) || <Users className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-[#1A3C4A]">{member.nome || 'Pendente'}</p>
                                            <p className="text-xs text-gray-400 font-bold">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${member.role === 'proprietario' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {member.role === 'proprietario' ? 'Dono / Diretor' : 'Colaborador'}
                                        </span>
                                        <button className="p-2 text-gray-300 hover:text-[#1A3C4A] transition-colors">
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Convites Pendentes */}
                    {invites.length > 0 && (
                        <div className="bg-white rounded-[40px] shadow-2xl shadow-black/5 border border-orange-100 overflow-hidden">
                            <div className="p-8 border-b border-orange-50 bg-orange-50/20 flex items-center gap-3">
                                <Mail className="w-5 h-5 text-orange-500" />
                                <h2 className="text-sm font-black uppercase tracking-widest text-[#1A3C4A]">Convites Aguardando Cadastro</h2>
                            </div>
                            <div className="divide-y divide-orange-50">
                                {invites.map(invite => (
                                    <div key={invite.id} className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-sm text-[#1A3C4A]">{invite.email || 'Link Geral'}</p>
                                            <p className="text-[10px] text-orange-400 font-black uppercase tracking-wider">Expira em: {new Date(invite.expira_em).toLocaleDateString()}</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const link = `${window.location.origin}/convite/${invite.token}`
                                                navigator.clipboard.writeText(link)
                                                alert('Link copiado!')
                                            }}
                                            className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-600 hover:underline"
                                        >
                                            <Copy className="w-3 h-3" /> Copiar Link
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Dicas */}
                <div className="space-y-6">
                    <div className="bg-[#1A3C4A] p-8 rounded-[40px] text-white shadow-2xl shadow-blue-900/20">
                        <h3 className="text-xs font-black uppercase tracking-widest opacity-50 mb-6">Como funciona?</h3>
                        <ul className="space-y-4">
                            <li className="flex gap-3">
                                <Check className="w-4 h-4 text-[#2D9E6B] flex-shrink-0" />
                                <p className="text-xs leading-relaxed">Gere o link e envie para o email ou WhatsApp do colaborador.</p>
                            </li>
                            <li className="flex gap-3">
                                <Check className="w-4 h-4 text-[#2D9E6B] flex-shrink-0" />
                                <p className="text-xs leading-relaxed">O colaborador clica no link, cria sua senha e entra automaticamente na sua ONG.</p>
                            </li>
                            <li className="flex gap-3">
                                <Check className="w-4 h-4 text-[#2D9E6B] flex-shrink-0" />
                                <p className="text-xs leading-relaxed">Você controla o que cada um vê alterando as permissões a qualquer momento.</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modal de Convite */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-[#1A3C4A]/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
                    <div className="bg-white max-w-xl w-full rounded-[40px] shadow-3xl p-10 space-y-8 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                                    <UserPlus className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-[#1A3C4A] tracking-tighter italic">Novo Convite</h2>
                                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">Configure o acesso do colaborador</p>
                                </div>
                            </div>
                            <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {!generatedLink ? (
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Email do Colaborador (Opcional)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input
                                            type="email"
                                            value={inviteEmail}
                                            onChange={e => setInviteEmail(e.target.value)}
                                            placeholder="ex: colaborador@gmail.com"
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#2D9E6B]/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Módulos Liberados</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {MODULOS.map(modulo => (
                                            <button
                                                key={modulo.id}
                                                onClick={() => togglePermission(modulo.id)}
                                                className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${permissions[modulo.id]
                                                    ? 'bg-green-50 border-green-200 text-green-700'
                                                    : 'bg-white border-gray-100 text-gray-400'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {permissions[modulo.id] ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4 opacity-30" />}
                                                    <span className="text-[10px] font-black uppercase tracking-tighter leading-tight">{modulo.nome}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleCreateInvite}
                                    className="w-full py-4 bg-[#1A3C4A] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#2E6B7A] transition-all shadow-xl shadow-blue-900/10"
                                >
                                    Gerar Link de Convite
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="p-8 bg-green-50 border border-green-100 rounded-[30px] text-center space-y-4">
                                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                                    <p className="text-gray-600 font-bold text-sm">Convite criado com sucesso!</p>
                                    <div className="bg-white p-4 rounded-2xl border border-green-200 break-all text-[10px] font-mono text-green-800">
                                        {generatedLink}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedLink)
                                        alert('Link copiado!')
                                    }}
                                    className="w-full py-4 bg-[#2D9E6B] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-green-600/20 flex items-center justify-center gap-2"
                                >
                                    <Copy className="w-4 h-4" /> Copiar Link e Fechar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
