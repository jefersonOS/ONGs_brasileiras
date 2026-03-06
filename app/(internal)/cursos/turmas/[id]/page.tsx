'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Calendar, Users } from 'lucide-react'

export default function TurmasPage({ params }: { params: { id: string } }) {
    const cursoId = params.id
    const router = useRouter()
    const supabase = createClient()

    const [curso, setCurso] = useState<any>(null)
    const [turmas, setTurmas] = useState<any[]>([])

    // Formulário Nova Turma
    const [mostrarForm, setMostrarForm] = useState(false)
    const [vagas, setVagas] = useState(30)
    const [encontros, setEncontros] = useState<{ data: string, hora_inicio: string, hora_fim: string }[]>([
        { data: '', hora_inicio: '', hora_fim: '' }
    ])

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
            encontros
        })

        if (!error) {
            setMostrarForm(false)
            setVagas(30)
            setEncontros([{ data: '', hora_inicio: '', hora_fim: '' }])
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
                <form onSubmit={handleCreateTurma} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-2">Cadastrar Nova Turma</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vagas Oferecidas *</label>
                        <input type="number" min="1" value={vagas} onChange={e => setVagas(Number(e.target.value))} required className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cronograma de Encontros</label>
                        {encontros.map((enc, i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-3 items-center">
                                <input type="date" required value={enc.data} onChange={e => { const ne = [...encontros]; ne[i].data = e.target.value; setEncontros(ne) }} className="w-full md:flex-1 px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                <span>das</span>
                                <input type="time" required value={enc.hora_inicio} onChange={e => { const ne = [...encontros]; ne[i].hora_inicio = e.target.value; setEncontros(ne) }} className="w-full md:w-32 px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                <span>às</span>
                                <input type="time" required value={enc.hora_fim} onChange={e => { const ne = [...encontros]; ne[i].hora_fim = e.target.value; setEncontros(ne) }} className="w-full md:w-32 px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B]" />
                                <button type="button" onClick={() => setEncontros(encontros.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setEncontros([...encontros, { data: '', hora_inicio: '', hora_fim: '' }])} className="text-sm font-medium text-[#2E6B7A] hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar Encontro</button>
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
                        <div className="p-4 space-y-4">
                            <div className="flex items-center gap-2 text-gray-600 text-sm">
                                <Users className="w-4 h-4" /> {turma.vagas} Vagas ofertadas
                            </div>
                            <div className="flex items-start gap-2 text-gray-600 text-sm">
                                <Calendar className="w-4 h-4 mt-0.5" />
                                <div>
                                    <span className="font-medium text-gray-800">{turma.encontros?.length || 0} Encontros</span>
                                    <ul className="mt-1 space-y-1 text-xs">
                                        {turma.encontros?.slice(0, 3).map((e: any, i: number) => (
                                            <li key={i}>{new Date(e.data).toLocaleDateString()} ({e.hora_inicio} - {e.hora_fim})</li>
                                        ))}
                                        {turma.encontros?.length > 3 && <li>...</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
                            <select
                                value={turma.status}
                                onChange={(e) => handleChangeStatus(turma.id, e.target.value)}
                                className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded outline-none"
                            >
                                <option value="aberta">Inscrições Abertas</option>
                                <option value="em_andamento">Em Andamento</option>
                                <option value="encerrada">Encerrada</option>
                            </select>
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
