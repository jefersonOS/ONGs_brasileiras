'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Save, Download, CheckCircle, XCircle, Users, Calendar, MapPin, UserPlus } from 'lucide-react'
import { clsx } from 'clsx'

export default function PresencasPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const atividadeId = params.id

    // States
    const [atividade, setAtividade] = useState<any>(null)
    const [encontroSelecionado, setEncontroSelecionado] = useState<string>('')
    const [inscricoes, setInscricoes] = useState<any[]>([])
    const [presencas, setPresencas] = useState<Record<string, boolean>>({}) // inscricao_id -> boolean
    const [loading, setLoading] = useState(false)
    const [buscandoWalkIn, setBuscandoWalkIn] = useState(false)
    const [busca, setBusca] = useState('')

    // Walk-in form state
    const [showWalkInForm, setShowWalkInForm] = useState(false)
    const [walkInName, setWalkInName] = useState('')
    const [walkInCPF, setWalkInCPF] = useState('')

    useEffect(() => {
        const fetchAll = async () => {
            const { data: ativData } = await supabase.from('atividades').select('*').eq('id', atividadeId).single()
            if (ativData) {
                setAtividade(ativData)
                if (ativData.datas && ativData.datas.length > 0) {
                    setEncontroSelecionado(`${ativData.datas[0].data} | ${ativData.datas[0].hora_inicio}`)
                }
            }

            const { data: inscData } = await supabase
                .from('inscricoes')
                .select(`
                    id,
                    dados_formulario,
                    users!cidadao_id ( id, nome, cpf, email, whatsapp )
                `)
                .eq('entidade_id', atividadeId)
                .eq('status', 'confirmada')

            if (inscData) setInscricoes(inscData)
        }

        fetchAll()
    }, [atividadeId, supabase])

    useEffect(() => {
        const fetchPresencasForEncontro = async () => {
            if (!encontroSelecionado) return
            const { data: pData } = await supabase
                .from('presencas')
                .select('inscricao_id, presente')
                .eq('encontro_id', encontroSelecionado)

            if (pData) {
                const map: Record<string, boolean> = {}
                pData.forEach(p => {
                    map[p.inscricao_id] = p.presente
                })
                setPresencas(map)
            } else {
                setPresencas({})
            }
        }
        fetchPresencasForEncontro()
    }, [encontroSelecionado, supabase])

    const handleSave = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        const ops = Object.keys(presencas).map(inscId => ({
            inscricao_id: inscId,
            encontro_id: encontroSelecionado,
            presente: presencas[inscId],
            registrado_por: user?.id,
            tenant_id: user?.user_metadata?.tenant_id
        }))

        try {
            // Limpa presenças do encontro antes de salvar
            await supabase.from('presencas').delete().eq('encontro_id', encontroSelecionado)
            if (ops.length > 0) {
                await supabase.from('presencas').insert(ops)
            }
            alert("Lista de presença salva com sucesso!")
        } catch (e) {
            console.error(e)
            alert("Erro ao salvar presenças.")
        }
        setLoading(false)
    }

    const togglePresenca = (inscricaoId: string) => {
        setPresencas(prev => ({
            ...prev,
            [inscricaoId]: !prev[inscricaoId]
        }))
    }

    const marcarTodosPresentes = () => {
        const map: Record<string, boolean> = {}
        inscricoes.forEach(i => {
            map[i.id] = true
        })
        setPresencas(map)
    }

    const handleWalkInSearch = async () => {
        if (!busca.trim()) return
        setBuscandoWalkIn(true)

        // 1. Tentar encontrar usuário pelo CPF ou nome
        const { data: userData } = await supabase
            .from('users')
            .select('id, nome, cpf')
            .or(`cpf.eq.${busca},nome.ilike.%${busca}%`)
            .limit(1)
            .single()

        if (userData) {
            // 2. Verificar se já está inscrito
            const { data: existingInsc } = await supabase
                .from('inscricoes')
                .select('id')
                .eq('entidade_id', atividadeId)
                .eq('cidadao_id', userData.id)
                .single()

            if (existingInsc) {
                setPresencas(prev => ({ ...prev, [existingInsc.id]: true }))
                setBusca('')
            } else {
                // 3. Criar inscrição walk-in
                const { data: { user } } = await supabase.auth.getUser()
                const { data: newInsc } = await supabase
                    .from('inscricoes')
                    .insert({
                        entidade_id: atividadeId,
                        cidadao_id: userData.id,
                        status: 'confirmada',
                        tenant_id: user?.user_metadata?.tenant_id,
                        observacoes: 'Walk-in (Adicionado na hora)'
                    })
                    .select('id')
                    .single()

                if (newInsc) {
                    setInscricoes(prev => [...prev, { id: newInsc.id, users: userData }])
                    setPresencas(prev => ({ ...prev, [newInsc.id]: true }))
                    setBusca('')
                }
            }
        } else {
            // Não encontrou, abre form rápido
            setShowWalkInForm(true)
            setWalkInName(busca)
        }
        setBuscandoWalkIn(false)
    }

    const totalInscritos = inscricoes.length
    const totalPresentes = Object.values(presencas).filter(Boolean).length
    const percentualPresenca = totalInscritos > 0 ? Math.round((totalPresentes / totalInscritos) * 100) : 0

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            {/* Header com Resumo */}
            <div className="bg-[#1A3C4A] p-8 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Users className="w-32 h-32" />
                </div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-widest mb-2">
                            <Calendar className="w-4 h-4" /> Controle de Presença
                        </div>
                        <h1 className="text-3xl font-bold">{atividade?.titulo || 'Carregando...'}</h1>
                        <p className="text-gray-300 mt-2 text-sm flex items-center gap-4">
                            <span><strong>{totalInscritos}</strong> Inscritos</span>
                            <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                            <span><strong>{totalPresentes}</strong> Presentes hoje</span>
                        </p>
                    </div>
                    <div className="flex flex-col items-center bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                        <span className="text-4xl font-black text-teal-400">{percentualPresenca}%</span>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Presença Real</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Listagem Central */}
                <div className="flex-1 space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#2D9E6B] transition-colors" />
                            <input
                                type="text"
                                placeholder="Busca rápida ou adicionar Walk-in..."
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleWalkInSearch()}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#2D9E6B] transition-all"
                            />
                            {busca && (
                                <button
                                    onClick={handleWalkInSearch}
                                    disabled={buscandoWalkIn}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#2D9E6B] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors uppercase"
                                >
                                    {buscandoWalkIn ? '...' : 'Adicionar'}
                                </button>
                            )}
                        </div>
                        <button
                            onClick={marcarTodosPresentes}
                            className="text-xs font-bold text-[#2D9E6B] hover:text-green-700 px-4 py-2 bg-teal-50 rounded-lg border border-teal-100 transition-all"
                        >
                            Marcar todos como Presentes
                        </button>
                    </div>

                    {(() => {
                        const camposForm: { id: string, label: string, is_whatsapp?: boolean }[] = atividade?.formulario_inscricao || []
                        const colCount = 2 + camposForm.length + 1 // participante + campos + status
                        const filtrados = inscricoes.filter(i =>
                            !busca ||
                            i.users?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                            i.users?.cpf?.includes(busca)
                        )
                        return (
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 whitespace-nowrap">Participante</th>
                                            {camposForm.map(c => (
                                                <th key={c.id} className="px-4 py-4 text-[10px] font-black uppercase text-gray-400 whitespace-nowrap">{c.label}</th>
                                            ))}
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-center whitespace-nowrap">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filtrados.length === 0 ? (
                                            <tr>
                                                <td colSpan={colCount} className="px-6 py-12 text-center text-gray-400 italic text-sm">Nenhum participante encontrado.</td>
                                            </tr>
                                        ) : (
                                            filtrados.map(insc => {
                                                const dados: Record<string, string> = insc.dados_formulario || {}
                                                return (
                                                    <tr key={insc.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 bg-teal-100 text-[#2D9E6B] rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                                    {insc.users?.nome?.[0] || '?'}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-800 leading-none mb-1 whitespace-nowrap">{insc.users?.nome || 'Sem nome'}</p>
                                                                    <p className="text-[10px] text-gray-500 font-medium">{insc.users?.email || '—'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {camposForm.map(c => {
                                                            const labelLower = c.label.toLowerCase()
                                                            let valor = dados[c.id] || ''
                                                            // fallback: busca no users para CPF e WhatsApp
                                                            if (!valor && labelLower.includes('cpf') && insc.users?.cpf) {
                                                                const raw = insc.users.cpf.replace(/\D/g, '')
                                                                valor = raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
                                                            }
                                                            if (!valor && (c.is_whatsapp || labelLower.includes('whatsapp')) && insc.users?.whatsapp) {
                                                                valor = insc.users.whatsapp
                                                            }
                                                            return (
                                                                <td key={c.id} className="px-4 py-4">
                                                                    <span className="text-sm text-gray-700 whitespace-nowrap">{valor || <span className="text-gray-300">—</span>}</span>
                                                                </td>
                                                            )
                                                        })}
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center">
                                                                <button
                                                                    onClick={() => togglePresenca(insc.id)}
                                                                    className={clsx(
                                                                        "w-24 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 border",
                                                                        presencas[insc.id]
                                                                            ? "bg-green-500 text-white border-green-400 shadow-[0_4px_12px_rgba(34,197,94,0.3)]"
                                                                            : "bg-white text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                                                                    )}
                                                                >
                                                                    {presencas[insc.id] ? (
                                                                        <><CheckCircle className="w-3 h-3" /> Presente</>
                                                                    ) : (
                                                                        <><XCircle className="w-3 h-3" /> Ausente</>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )
                    })()}
                </div>

                {/* Sidebar com Opções */}
                <div className="w-full lg:w-72 space-y-4">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-widest">Configuração</h4>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Data do Encontro</label>
                            <select
                                value={encontroSelecionado}
                                onChange={e => setEncontroSelecionado(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-xl text-xs py-3 font-semibold focus:ring-2 focus:ring-[#2D9E6B]"
                            >
                                <option value="">Selecione...</option>
                                {atividade?.datas?.map((d: any, i: number) => (
                                    <option key={i} value={`${d.data} | ${d.hora_inicio}`}>
                                        {new Date(d.data).toLocaleDateString()} - {d.hora_inicio}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {atividade?.is_itinerante && (
                            <div className="pt-2">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-[#2D9E6B]" /> Local do Encontro
                                </label>
                                <div className="text-[10px] bg-teal-50 p-2 rounded-lg text-teal-700 font-medium">
                                    Atividade Itinerante: Registrando presença para o local definido na agenda.
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-[#1A3C4A] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#2D9E6B] transition-all shadow-lg hover:shadow-teal-900/20 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" /> {loading ? 'Salvando...' : 'Salvar Presenças'}
                    </button>

                    <button className="w-full bg-white text-gray-600 border border-gray-200 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                        <Download className="w-4 h-4" /> Exportar Lista PDF
                    </button>
                </div>
            </div>

            {/* Modal Walk-In Form Rápido */}
            {showWalkInForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-teal-100 rounded-2xl text-[#2D9E6B]">
                                <UserPlus className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-[#1A3C4A]">Cadastro Walk-in</h3>
                                <p className="text-xs text-gray-500">Participante de última hora.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={walkInName}
                                    onChange={e => setWalkInName(e.target.value)}
                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">CPF</label>
                                <input
                                    type="text"
                                    value={walkInCPF}
                                    onChange={e => setWalkInCPF(e.target.value.replace(/\D/g, '').substring(0, 11))}
                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm"
                                    placeholder="000.000.000-00"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowWalkInForm(false)} className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-gray-600">Cancelar</button>
                            <button
                                onClick={async () => {
                                    // mock de criação rápida e inserção (seria similar ao handleWalkInSearch mas criando o user primeiro)
                                    alert('Funcionalidade de criação rápida de usuário será habilitada com o backend de usuários.');
                                    setShowWalkInForm(false);
                                }}
                                className="flex-2 bg-[#2D9E6B] text-white px-8 py-3 rounded-xl font-bold text-sm"
                            >
                                Salvar e Presentear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
