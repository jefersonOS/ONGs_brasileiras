'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Calendar, Users, FileText, ChevronDown, ChevronUp, GripVertical, Phone, ToggleLeft, ToggleRight, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type TipoCampo = 'texto' | 'email' | 'telefone' | 'numero' | 'selecao' | 'textarea'

interface CampoFormulario {
    id: string
    tipo: TipoCampo
    label: string
    placeholder: string
    obrigatorio: boolean
    opcoes: string[]
    is_whatsapp: boolean
}

const TIPOS_CAMPO: { value: TipoCampo, label: string }[] = [
    { value: 'texto', label: 'Texto curto' },
    { value: 'email', label: 'E-mail' },
    { value: 'telefone', label: 'Telefone / WhatsApp' },
    { value: 'numero', label: 'Número' },
    { value: 'selecao', label: 'Seleção (dropdown)' },
    { value: 'textarea', label: 'Texto longo' },
]

const CAMPOS_DEFAULT: CampoFormulario[] = [
    { id: '1', tipo: 'texto', label: 'Nome Completo', placeholder: 'Seu nome completo', obrigatorio: true, opcoes: [], is_whatsapp: false },
    { id: '2', tipo: 'email', label: 'E-mail', placeholder: 'seu@email.com', obrigatorio: true, opcoes: [], is_whatsapp: false },
    { id: '3', tipo: 'telefone', label: 'WhatsApp', placeholder: '(00) 00000-0000', obrigatorio: true, opcoes: [], is_whatsapp: true },
    { id: '4', tipo: 'texto', label: 'CPF', placeholder: '000.000.000-00', obrigatorio: false, opcoes: [], is_whatsapp: false },
]

function FormBuilder({ campos, setCampos }: { campos: CampoFormulario[], setCampos: (c: CampoFormulario[]) => void }) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const addCampo = () => {
        const newCampo: CampoFormulario = {
            id: Date.now().toString(),
            tipo: 'texto',
            label: 'Novo Campo',
            placeholder: '',
            obrigatorio: false,
            opcoes: [],
            is_whatsapp: false,
        }
        setCampos([...campos, newCampo])
        setExpandedId(newCampo.id)
    }

    const updateCampo = (id: string, patch: Partial<CampoFormulario>) => {
        setCampos(campos.map(c => c.id === id ? { ...c, ...patch } : c))
    }

    const removeCampo = (id: string) => {
        setCampos(campos.filter(c => c.id !== id))
    }

    const moveUp = (i: number) => {
        if (i === 0) return
        const next = [...campos]
        ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
        setCampos(next)
    }

    const moveDown = (i: number) => {
        if (i === campos.length - 1) return
        const next = [...campos]
        ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
        setCampos(next)
    }

    return (
        <div className="space-y-3">
            {campos.map((campo, i) => (
                <div key={campo.id} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                    {/* Header do campo */}
                    <div className="flex items-center gap-2 p-3 bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === campo.id ? null : campo.id)}>
                        <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm text-gray-800">{campo.label || 'Sem título'}</span>
                            <span className="ml-2 text-[10px] text-gray-400 uppercase">{TIPOS_CAMPO.find(t => t.value === campo.tipo)?.label}</span>
                            {campo.is_whatsapp && <span className="ml-2 text-[10px] text-green-600 font-bold uppercase">WhatsApp</span>}
                            {campo.obrigatorio && <span className="ml-2 text-[10px] text-red-500 uppercase">*obrigatório</span>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            <button type="button" onClick={e => { e.stopPropagation(); moveUp(i) }} className="p-1 text-gray-400 hover:text-gray-600"><ChevronUp className="w-3 h-3" /></button>
                            <button type="button" onClick={e => { e.stopPropagation(); moveDown(i) }} className="p-1 text-gray-400 hover:text-gray-600"><ChevronDown className="w-3 h-3" /></button>
                            <button type="button" onClick={e => { e.stopPropagation(); removeCampo(campo.id) }} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </div>

                    {/* Configurações do campo (expandido) */}
                    {expandedId === campo.id && (
                        <div className="p-4 space-y-3 border-t border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de Campo</label>
                                    <select
                                        value={campo.tipo}
                                        onChange={e => updateCampo(campo.id, { tipo: e.target.value as TipoCampo, is_whatsapp: e.target.value === 'telefone' ? campo.is_whatsapp : false })}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white focus:outline-none"
                                    >
                                        {TIPOS_CAMPO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Rótulo (label)</label>
                                    <input
                                        type="text"
                                        value={campo.label}
                                        onChange={e => updateCampo(campo.id, { label: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none"
                                        placeholder="Ex: Nome Completo"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Placeholder (dica)</label>
                                    <input
                                        type="text"
                                        value={campo.placeholder}
                                        onChange={e => updateCampo(campo.id, { placeholder: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none"
                                        placeholder="Ex: Digite seu nome..."
                                    />
                                </div>
                                <div className="flex items-center gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => updateCampo(campo.id, { obrigatorio: !campo.obrigatorio })}
                                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${campo.obrigatorio ? 'text-red-600' : 'text-gray-400'}`}
                                    >
                                        {campo.obrigatorio ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                        Obrigatório
                                    </button>
                                    {campo.tipo === 'telefone' && (
                                        <button
                                            type="button"
                                            onClick={() => updateCampo(campo.id, { is_whatsapp: !campo.is_whatsapp })}
                                            className={`flex items-center gap-2 text-sm font-medium transition-colors ${campo.is_whatsapp ? 'text-green-600' : 'text-gray-400'}`}
                                        >
                                            {campo.is_whatsapp ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                                            <Phone className="w-4 h-4" /> Usar para WhatsApp
                                        </button>
                                    )}
                                </div>
                            </div>

                            {campo.tipo === 'selecao' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Opções (uma por linha)</label>
                                    <textarea
                                        rows={4}
                                        value={campo.opcoes.join('\n')}
                                        onChange={e => updateCampo(campo.id, { opcoes: e.target.value.split('\n') })}
                                        onKeyDown={e => e.stopPropagation()}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none"
                                        placeholder={"Opção 1\nOpção 2\nOpção 3"}
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">Pressione Enter para adicionar uma nova opção</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            <button
                type="button"
                onClick={addCampo}
                className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-lg text-sm font-medium text-gray-400 hover:border-[#2D9E6B] hover:text-[#2D9E6B] transition-colors flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> Adicionar Campo
            </button>
        </div>
    )
}

export default function TurmasPage({ params }: { params: { id: string } }) {
    const cursoId = params.id
    const supabase = createClient()

    const [curso, setCurso] = useState<{ titulo: string } | null>(null)
    const [turmas, setTurmas] = useState<{ id: string, status: string, vagas: number, data_inicio: string, data_fim: string, data_limite_inscricao: string, formulario_inscricao: CampoFormulario[] | null }[]>([])

    const [mostrarForm, setMostrarForm] = useState(false)
    const [vagas, setVagas] = useState(30)
    const [dataInicio, setDataInicio] = useState('')
    const [dataFim, setDataFim] = useState('')
    const [dataLimiteInscricao, setDataLimiteInscricao] = useState('')
    const [formularioInscricao, setFormularioInscricao] = useState<CampoFormulario[]>(CAMPOS_DEFAULT)

    const [loading, setLoading] = useState(false)

    const fetchAll = async () => {
        const { data: cursoData } = await supabase.from('cursos').select('*').eq('id', cursoId).single()
        if (cursoData) setCurso(cursoData)

        const { data: turmasData } = await supabase.from('turmas').select('*').eq('curso_id', cursoId).order('created_at', { ascending: false })
        if (turmasData) setTurmas(turmasData)
    }

    useEffect(() => {
        fetchAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cursoId])

    const handleCreateTurma = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase.from('turmas').insert({
            curso_id: cursoId,
            tenant_id: user?.user_metadata?.tenant_id,
            vagas,
            status: 'aberta',
            data_inicio: dataInicio || null,
            data_fim: dataFim || null,
            data_limite_inscricao: dataLimiteInscricao || null,
            formulario_inscricao: formularioInscricao,
        })

        if (!error) {
            setMostrarForm(false)
            setVagas(30)
            setDataInicio('')
            setDataFim('')
            setDataLimiteInscricao('')
            setFormularioInscricao(CAMPOS_DEFAULT)
            fetchAll()
        }
        setLoading(false)
    }

    const handleChangeStatus = async (turmaId: string, novoStatus: string) => {
        await supabase.from('turmas').update({ status: novoStatus }).eq('id', turmaId)
        fetchAll()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/cursos" className="text-xs font-black uppercase text-[#2D9E6B] hover:underline flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-3 h-3" /> Voltar para Cursos
                    </Link>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Turmas</h1>
                    <p className="text-gray-500 mt-1">Curso: {curso?.titulo || 'Carregando...'}</p>
                </div>
                <button
                    onClick={() => setMostrarForm(!mostrarForm)}
                    className="bg-[#2D9E6B] hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> Nova Turma
                </button>
            </div>

            {mostrarForm && (
                <form onSubmit={handleCreateTurma} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-8">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">Cadastrar Nova Turma</h3>

                    {/* Vagas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vagas Oferecidas *</label>
                        <input type="number" min="1" value={vagas} onChange={e => setVagas(Number(e.target.value))} required className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                    </div>

                    {/* Cronograma */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">Período do Curso</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Data de Início *</label>
                                <input type="date" required value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Data de Encerramento *</label>
                                <input type="date" required value={dataFim} min={dataInicio} onChange={e => setDataFim(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Limite de Inscrições</label>
                                <input type="date" value={dataLimiteInscricao} max={dataInicio || undefined} onChange={e => setDataLimiteInscricao(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                <p className="text-[11px] text-gray-400 mt-1">Inscrições fecham nesta data</p>
                            </div>
                        </div>
                    </div>

                    {/* Formulário de Inscrição */}
                    <div>
                        <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-800">Formulário de Inscrição</h4>
                            <p className="text-xs text-gray-400 mt-1">Monte o formulário que os interessados preencherão ao se inscrever. O campo marcado como <span className="text-green-600 font-medium">WhatsApp</span> será usado para envio da confirmação.</p>
                        </div>
                        <FormBuilder campos={formularioInscricao} setCampos={setFormularioInscricao} />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button type="button" onClick={() => setMostrarForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-[#1A3C4A] text-white rounded-md hover:bg-[#2E6B7A] disabled:opacity-50">Salvar Turma</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {turmas?.map(turma => (
                    <div key={turma.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <span className="font-semibold text-gray-700">Turma #{turma.id.split('-')[0]}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${turma.status === 'aberta' ? 'bg-blue-100 text-blue-700' : turma.status === 'em_andamento' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-800'}`}>
                                {turma.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Users className="w-4 h-4" /> {turma.vagas} Vagas ofertadas
                            </div>
                            {turma.data_inicio && (
                                <div className="flex items-start gap-2 text-gray-600 text-sm">
                                    <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-0.5 text-xs">
                                        <p><span className="font-medium text-gray-700">Início:</span> {new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                        {turma.data_fim && <p><span className="font-medium text-gray-700">Encerramento:</span> {new Date(turma.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}</p>}
                                        {turma.data_limite_inscricao && (
                                            <p className="text-amber-600"><span className="font-medium">Inscrições até:</span> {new Date(turma.data_limite_inscricao + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                            {turma.formulario_inscricao && (
                                <div className="flex items-center gap-2 text-gray-500 text-xs">
                                    <FileText className="w-3.5 h-3.5" />
                                    {turma.formulario_inscricao.length} campo{turma.formulario_inscricao.length !== 1 ? 's' : ''} no formulário
                                    {turma.formulario_inscricao.some(c => c.is_whatsapp) && (
                                        <span className="text-green-600 font-medium flex items-center gap-1"><Phone className="w-3 h-3" /> WhatsApp ativo</span>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                            <select
                                value={turma.status}
                                onChange={(e) => handleChangeStatus(turma.id, e.target.value)}
                                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded outline-none bg-white"
                            >
                                <option value="aberta">Inscrições Abertas</option>
                                <option value="em_andamento">Em Andamento</option>
                                <option value="encerrada">Encerrada</option>
                            </select>
                            <Link
                                href={`/cursos/${cursoId}/turmas/${turma.id}/presenca`}
                                className="whitespace-nowrap bg-white border border-gray-300 px-3 py-1.5 rounded text-xs font-bold text-[#1A3C4A] hover:bg-gray-50 flex items-center gap-1"
                            >
                                <Users className="w-3 h-3" /> Presença
                            </Link>
                            <Link
                                href={`/cursos/${cursoId}/turmas/${turma.id}/certificados`}
                                className="whitespace-nowrap bg-[#1A3C4A] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-800 flex items-center gap-1"
                            >
                                <FileText className="w-3 h-3" /> Cert.
                            </Link>
                        </div>
                    </div>
                ))}

                {turmas.length === 0 && !loading && (
                    <div className="col-span-full py-12 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        Nenhuma turma cadastrada para este curso.
                    </div>
                )}
            </div>
        </div>
    )
}
