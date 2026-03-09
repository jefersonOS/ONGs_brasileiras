'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, X, Calendar, Users, ArrowLeft, Save, Printer } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'

export default function CoursePresencePage({ params }: { params: { id: string, turmaId: string } }) {
    const { id: cursoId, turmaId } = params
    const supabase = createClient()

    const [curso, setCurso] = useState<any>(null)
    const [turma, setTurma] = useState<any>(null)
    const [encontroIndex] = useState(0)
    const [inscritos, setInscritos] = useState<any[]>([])
    const [presencas, setPresencas] = useState<Record<string, boolean>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const fetchPresencas = useCallback(async (index: number) => {
        const { data: presencasExistentes } = await supabase
            .from('presencas')
            .select('inscricao_id, presente')
            .eq('encontro_id', `meeting_${index}`)
        // Nota: encontro_id é text, usamos meeting_INDEX para diferenciar encontros da mesma turma

        const newPresencas: Record<string, boolean> = {}
        presencasExistentes?.forEach(p => {
            newPresencas[p.inscricao_id] = p.presente
        })
        setPresencas(newPresencas)
    }, [supabase])

    useEffect(() => {
        const fetchData = async () => {
            // 1. Curso e Turma
            const { data: cursoData } = await supabase.from('cursos').select('*').eq('id', cursoId).single()
            const { data: turmaData } = await supabase.from('turmas').select('*').eq('id', turmaId).single()

            if (cursoData) setCurso(cursoData)
            if (turmaData) setTurma(turmaData)

            // 2. Inscritos
            const { data: inscritosData } = await supabase
                .from('inscricoes')
                .select('id, dados_formulario, telefone_whatsapp, users(id, nome, email, cpf, whatsapp)')
                .eq('turma_id', turmaId)
                .eq('status', 'confirmada')

            if (inscritosData) setInscritos(inscritosData)

            // 3. Presenças do encontro atual (encontro_id será o index do array de encontros da turma)
            await fetchPresencas(0) // Default primeiro encontro

            setLoading(false)
        }

        fetchData()
    }, [cursoId, turmaId, supabase, fetchPresencas])

    const togglePresenca = (inscricaoId: string) => {
        setPresencas(prev => ({
            ...prev,
            [inscricaoId]: !prev[inscricaoId]
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            // 1. Deletar presenças antigas deste encontro
            await supabase.from('presencas').delete().eq('encontro_id', `meeting_${encontroIndex}`)

            // 2. Inserir novas
            const payload = Object.entries(presencas).map(([inscricaoId, presente]) => ({
                inscricao_id: inscricaoId,
                encontro_id: `meeting_${encontroIndex}`,
                presente,
                registrado_por: user?.id
            }))

            if (payload.length > 0) {
                const { error } = await supabase.from('presencas').insert(payload)
                if (error) throw error
            }

            alert('Presenças salvas com sucesso!')
        } catch (error) {
            console.error(error)
            alert('Erro ao salvar presenças')
        } finally {
            setSaving(false)
        }
    }

    const exportarCSV = () => {
        const cabecalho = ['Nome', 'Email', 'WhatsApp', 'CPF', 'Presença']
        const linhas = inscritos.map(inscrito => {
            const u = inscrito.users
            const whatsapp = inscrito.telefone_whatsapp || u?.whatsapp || ''
            const presente = presencas[inscrito.id] ? 'Presente' : 'Ausente'
            return [
                u?.nome || '',
                u?.email || '',
                whatsapp,
                u?.cpf || '',
                presente,
            ].map(v => `"${String(v).replace(/"/g, '""')}"`)
        })

        const csv = [cabecalho.join(','), ...linhas.map(l => l.join(','))].join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `presenca-${curso?.titulo?.replace(/[^a-zA-Z0-9]/g, '-') || 'turma'}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando controle de presença...</div>

    const totalPresentes = Object.values(presencas).filter(v => v).length
    const porcentagemGeral = inscritos.length > 0 ? Math.round((totalPresentes / inscritos.length) * 100) : 0

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link href={`/cursos/turmas/${cursoId}`} className="text-xs font-black uppercase text-[#2D9E6B] hover:underline flex items-center gap-1 mb-2">
                        <ArrowLeft className="w-3 h-3" /> Voltar para Turmas
                    </Link>
                    <h1 className="text-2xl font-black text-[#1A3C4A]">{curso?.titulo}</h1>
                    <p className="text-gray-500 text-sm">Turma #{turmaId.split('-')[0]} • Controle de Frequência</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={exportarCSV} className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-all">
                        <Printer className="w-4 h-4" /> Exportar Lista
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-[#2D9E6B] text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-600 transition-all shadow-lg shadow-green-900/20 disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Chamada'}
                    </button>
                </div>
            </div>

            {/* Info da Turma */}
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 flex items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#2D9E6B]">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase text-gray-400">Período do Curso</p>
                            <h3 className="font-bold text-[#1A3C4A]">
                                {turma?.data_inicio
                                    ? `${new Date(turma.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}${turma.data_fim ? ` até ${new Date(turma.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}` : ''}`
                                    : 'Datas não definidas'}
                            </h3>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center items-center p-4 bg-[#F0FDF4] rounded-2xl border border-green-100">
                        <p className="text-[10px] font-black uppercase text-green-600 mb-1">Presença Geral</p>
                        <div className="text-3xl font-black text-[#2D9E6B]">{porcentagemGeral}%</div>
                    </div>
                </div>
            </div>

            {/* Lista de Chamada */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="font-black text-[#1A3C4A] flex items-center gap-2 uppercase text-xs tracking-widest">
                        <Users className="w-4 h-4 text-[#2D9E6B]" /> Lista de Alunos ({inscritos.length})
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const all: Record<string, boolean> = {}
                                inscritos.forEach(i => all[i.id] = true)
                                setPresencas(all)
                            }}
                            className="text-[10px] font-black uppercase text-[#2D9E6B] hover:underline"
                        >
                            Marcar Todos
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-gray-100">
                    {inscritos.map((inscrito) => {
                        const u = inscrito.users
                        const nome = u?.nome || 'Sem nome'
                        const iniciais = nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                        const whatsapp = inscrito.telefone_whatsapp || u?.whatsapp
                        const dadosExtra = inscrito.dados_formulario
                            ? Object.entries(inscrito.dados_formulario as Record<string, string>)
                                .filter(([, v]) => v)
                            : []
                        return (
                        <div key={inscrito.id} className="p-4 flex items-start justify-between gap-4 hover:bg-gray-50/50 transition-all">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center font-black text-[#1A3C4A] text-xs uppercase flex-shrink-0 mt-0.5">
                                    {iniciais}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[#1A3C4A] text-sm">{nome}</h4>
                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                                        {u?.email && <span className="text-[10px] text-gray-500">✉ {u.email}</span>}
                                        {whatsapp && <span className="text-[10px] text-gray-500">📱 {whatsapp}</span>}
                                        {u?.cpf && <span className="text-[10px] font-mono text-gray-400">CPF: {u.cpf}</span>}
                                    </div>
                                    {dadosExtra.length > 0 && (
                                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                                            {dadosExtra.map(([label, valor]) => (
                                                <span key={label} className="text-[10px] text-gray-400"><span className="font-semibold text-gray-500">{label}:</span> {valor}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => togglePresenca(inscrito.id)}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all border shadow-sm",
                                    presencas[inscrito.id]
                                        ? "bg-[#2D9E6B] text-white border-green-600"
                                        : "bg-white text-red-500 border-red-100 hover:border-red-300"
                                )}
                            >
                                {presencas[inscrito.id] ? <><Check className="w-3 h-3" /> Presente</> : <><X className="w-3 h-3" /> Ausente</>}
                            </button>
                        </div>
                        )
                    })}

                    {inscritos.length === 0 && (
                        <div className="p-12 text-center text-gray-400 italic">
                            Nenhum aluno inscrito nesta turma.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
