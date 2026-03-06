'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogOut, User, BookOpen, Award, FileText, Download } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MinhaAreaPage() {
    const supabase = createClient()
    const router = useRouter()

    const [user, setUser] = useState<any>(null)
    const [activeTab, setActiveTab] = useState('inscricoes')
    const [loading, setLoading] = useState(true)

    // Data
    const [inscricoes, setInscricoes] = useState<any[]>([])
    const [certificados, setCertificados] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const { data: { user: currentUser } } = await supabase.auth.getUser()

            if (!currentUser) {
                router.push('/login?redirectTo=/minha-area')
                return
            }

            setUser(currentUser)

            // Buscar Inscrições Polymorphic
            const { data: inscData } = await supabase
                .from('inscricoes')
                .select('*')
                .eq('cidadao_id', currentUser.id)
                .order('created_at', { ascending: false })

            if (inscData && inscData.length > 0) {
                // Fetch details mapping
                const cursosIds = inscData.filter(i => i.entidade_tipo === 'curso').map(i => i.entidade_id)
                const atividadesIds = inscData.filter(i => i.entidade_tipo === 'atividade').map(i => i.entidade_id)
                const turmasIds = inscData.filter(i => i.turma_id).map(i => i.turma_id)

                const { data: cursosData } = await supabase.from('cursos').select('id, titulo, modalidade').in('id', cursosIds.length ? cursosIds : ['00000000-0000-0000-0000-000000000000'])
                const { data: ativData } = await supabase.from('atividades').select('id, titulo, tipo, datas').in('id', atividadesIds.length ? atividadesIds : ['00000000-0000-0000-0000-000000000000'])
                const { data: turmasData } = await supabase.from('turmas').select('id, encontros').in('id', turmasIds.length ? turmasIds : ['00000000-0000-0000-0000-000000000000'])

                const enriched = inscData.map(insc => {
                    let detalhes = null
                    if (insc.entidade_tipo === 'curso') detalhes = cursosData?.find(c => c.id === insc.entidade_id)
                    if (insc.entidade_tipo === 'atividade') detalhes = ativData?.find(a => a.id === insc.entidade_id)
                    const turma = turmasData?.find(t => t.id === insc.turma_id)

                    return { ...insc, detalhes, turma }
                })
                setInscricoes(enriched)
            }

            // Buscar Certificados
            const { data: certData } = await supabase
                .from('certificados')
                .select('*')
                .eq('cidadao_id', currentUser.id)
                .order('emitido_em', { ascending: false })

            if (certData) setCertificados(certData)

            setLoading(false)
        }

        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F7F8] flex items-center justify-center">
                <div className="animate-pulse w-12 h-12 border-4 border-[#2D9E6B] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F5F7F8] pb-12">
            {/* Header Área Logada */}
            <div className="bg-[#1A3C4A] pt-12 pb-20 px-6 text-white">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-[#2D9E6B] rounded-full flex items-center justify-center text-2xl font-bold uppercase shadow-md">
                            {user?.user_metadata?.nome?.charAt(0) || user?.email?.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">{user?.user_metadata?.nome || 'Usuário'}</h1>
                            <p className="text-[#8FB3BF] text-sm">{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="text-[#8FB3BF] hover:text-white flex items-center gap-2 text-sm font-medium transition-colors bg-white/10 px-4 py-2 rounded-lg">
                        <LogOut className="w-4 h-4" /> Sair da conta
                    </button>
                </div>
            </div>

            {/* Main Container */}
            <div className="max-w-5xl mx-auto px-6 -mt-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Tabs Navigation */}
                    <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('inscricoes')}
                            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'inscricoes' ? 'text-[#1A3C4A] border-b-2 border-[#2D9E6B] bg-gray-50/50' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <BookOpen className="w-4 h-4" /> Minhas Inscrições
                        </button>
                        <button
                            onClick={() => setActiveTab('certificados')}
                            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'certificados' ? 'text-[#1A3C4A] border-b-2 border-[#2D9E6B] bg-gray-50/50' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <Award className="w-4 h-4" /> Meus Certificados
                        </button>
                        <button
                            onClick={() => setActiveTab('dados')}
                            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm transition-colors whitespace-nowrap ${activeTab === 'dados' ? 'text-[#1A3C4A] border-b-2 border-[#2D9E6B] bg-gray-50/50' : 'text-gray-500 hover:text-gray-800'}`}
                        >
                            <User className="w-4 h-4" /> Meus Dados
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 md:p-8">

                        {/* Tab: Inscrições */}
                        {activeTab === 'inscricoes' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Acompanhe suas participações</h2>

                                {inscricoes.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">Você ainda não se inscreveu em nenhum curso ou atividade.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {inscricoes.map(insc => (
                                            <div key={insc.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="text-[10px] uppercase tracking-wider font-bold bg-teal-50 text-[#2E6B7A] px-2 py-1 rounded">
                                                            {insc.entidade_tipo}
                                                        </span>
                                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${insc.status === 'confirmada' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            {insc.status}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-gray-800 text-lg leading-tight mb-2">
                                                        {insc.detalhes?.titulo || 'Título indisponível'}
                                                    </h3>

                                                    {insc.entidade_tipo === 'curso' && insc.turma && (
                                                        <p className="text-xs text-gray-500 mb-2">Turma #{insc.turma.id.split('-')[0]}</p>
                                                    )}
                                                </div>

                                                <div className="pt-4 mt-4 border-t border-gray-50 flex items-center gap-2 text-sm text-gray-600">
                                                    <FileText className="w-4 h-4 text-gray-400" /> Protocolo: <span className="font-mono text-xs">{insc.id.split('-')[0]}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Certificados */}
                        {activeTab === 'certificados' && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Suas conquistas</h2>

                                {certificados.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                        <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">Você ainda não possui certificados emitidos.</p>
                                        <p className="text-xs text-gray-400 mt-1">Sua presença nas atividades é essencial para a emissão.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {certificados.map(cert => (
                                            <div key={cert.id} className="flex flex-col md:flex-row items-center justify-between p-5 border border-gray-200 rounded-lg hover:border-[#2D9E6B] transition-colors gap-4">
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0 text-[#2E6B7A]">
                                                        <Award className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-800 capitalize">{cert.tipo} de Participação</h4>
                                                        <p className="text-sm text-gray-500">Emitido em {new Date(cert.emitido_em).toLocaleDateString()}</p>
                                                        <p className="text-xs text-gray-400 font-mono mt-0.5">Código: {cert.codigo_validacao}</p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`/api/certificados/${cert.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors whitespace-nowrap"
                                                >
                                                    <Download className="w-4 h-4" /> Baixar PDF
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Meus Dados */}
                        {activeTab === 'dados' && (
                            <div className="max-w-xl">
                                <h2 className="text-xl font-bold text-gray-800 mb-6">Suas informações</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Nome Completo</label>
                                        <input type="text" disabled value={user?.user_metadata?.nome || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">E-mail</label>
                                        <input type="email" disabled value={user?.email || ''} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">CPF</label>
                                        <input type="text" disabled value={user?.user_metadata?.cpf || 'Não informado'} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700" />
                                    </div>
                                    <p className="text-xs text-orange-600 mt-4 bg-orange-50 p-3 rounded border border-orange-100">
                                        Para alterar seus dados cadastrais, por favor entre em contato com a secretaria da Instituição.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}
