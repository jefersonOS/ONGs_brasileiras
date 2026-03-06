import { createClient } from '@/lib/supabase/server'
import { getTenant } from '@/lib/tenant-server'
import { redirect } from 'next/navigation'
import { GraduationCap, CalendarDays, FileText, User, Download } from 'lucide-react'
import Link from 'next/link'

export default async function MinhaAreaPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const tenant = await getTenant()

    if (!user) redirect('/login')

    // 1. Buscar Inscrições (Cursos + Atividades)
    const { data: inscricoes } = await supabase
        .from('inscricoes')
        .select('*, turmas(*, curso:cursos(*)), atividades(*)')
        .eq('cidadao_id', user.id)
        .order('created_at', { ascending: false })

    // 2. Buscar Certificados
    const { data: certificados } = await supabase
        .from('certificados')
        .select('*, turmas(*, curso:cursos(*))')
        .eq('cidadao_id', user.id)

    return (
        <div className="bg-[#F5F7F8] min-h-screen py-12 px-6 lg:px-12 animate-in slide-in-from-bottom-4 duration-700">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* Boas vindas */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-[#1A3C4A] tracking-tighter">Olá, {user.user_metadata?.nome || user.email?.split('@')[0]}!</h1>
                        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[var(--secondary)]"></span> Área exclusiva do Cidadão na {tenant?.nome}
                        </p>
                    </div>
                </div>

                {/* Grid principal com Tabs "Artificiais" (UX simplificada) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                    {/* Coluna Esquerda: Inscrições e Atividades */}
                    <div className="lg:col-span-2 space-y-10">
                        <section>
                            <h2 className="text-xl font-black text-[#1A3C4A] mb-8 flex items-center gap-3">
                                <GraduationCap className="w-6 h-6 text-[var(--secondary)]" /> Minhas Inscrições
                            </h2>
                            <div className="grid grid-cols-1 gap-6">
                                {inscricoes?.map(ins => {
                                    const item = ins.turmas?.curso || ins.atividades
                                    if (!item) return null

                                    return (
                                        <div key={ins.id} className="bg-white rounded-[32px] p-8 shadow-2xl shadow-black/5 border border-gray-50 hover:border-[var(--secondary)] transition-all group flex flex-col md:flex-row gap-8 items-center">
                                            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center text-[var(--primary)] flex-shrink-0 group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                                                {ins.entidade_tipo === 'curso' ? <GraduationCap className="w-8 h-8" /> : <CalendarDays className="w-8 h-8" />}
                                            </div>
                                            <div className="flex-1 text-center md:text-left">
                                                <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-2">
                                                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${ins.status === 'confirmada' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                                                        {ins.status}
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 px-3 py-1 rounded-full">
                                                        #{ins.id.split('-')[0]}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-black text-[#1A3C4A]">{item.titulo}</h3>
                                                {ins.turmas && (
                                                    <p className="text-xs text-gray-400 font-bold mt-2">Turma iniciada em {new Date(ins.turmas.created_at).toLocaleDateString()}</p>
                                                )}
                                            </div>
                                            <Link
                                                href={`/${ins.entidade_tipo === 'curso' ? 'cursos' : 'atividades'}/${item.id}`}
                                                className="px-8 py-4 bg-gray-50 text-[var(--primary)] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[var(--primary)] hover:text-white transition-all"
                                            >
                                                Ver Detalhes
                                            </Link>
                                        </div>
                                    )
                                })}
                                {(!inscricoes || inscricoes.length === 0) && (
                                    <div className="p-12 text-center bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                                        <p className="text-gray-400 font-black uppercase text-xs tracking-widest">Você ainda não se inscreveu em nada.</p>
                                        <Link href="/" className="inline-block mt-6 text-[var(--primary)] font-black uppercase text-[10px] border-b-2 border-[var(--secondary)]">Explorar Portal</Link>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Coluna Direita: Certificados e Dados */}
                    <div className="space-y-12">
                        <section>
                            <h2 className="text-xl font-black text-[#1A3C4A] mb-8 flex items-center gap-3">
                                <FileText className="w-6 h-6 text-[var(--secondary)]" /> Certificados
                            </h2>
                            <div className="space-y-4">
                                {certificados?.map(cert => (
                                    <div key={cert.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-black/5 hover:scale-105 transition-transform">
                                        <h4 className="text-sm font-black text-[#1A3C4A] mb-4">{cert.turmas?.curso?.titulo}</h4>
                                        <a
                                            href={cert.pdf_url}
                                            target="_blank"
                                            className="flex items-center justify-between w-full p-4 bg-teal-50 text-[var(--secondary)] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--secondary)] hover:text-white transition-all"
                                        >
                                            Baixar PDF <Download className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))}
                                {(!certificados || certificados.length === 0) && (
                                    <div className="p-8 text-center bg-white rounded-[32px] border border-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                        Nenhum certificado emitido.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="bg-[var(--primary)] rounded-[40px] p-10 text-white shadow-2xl shadow-[var(--primary)]/30">
                            <h2 className="text-xl font-black mb-8 flex items-center gap-3">
                                <User className="w-6 h-6 text-[var(--secondary)]" /> Meus Dados
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase opacity-40 block mb-2 tracking-widest">E-mail</label>
                                    <p className="font-bold">{user.email}</p>
                                </div>
                                <div className="pt-6 border-t border-white/10">
                                    <button className="w-full py-4 bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                                        Alterar Dados
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                </div>
            </div>
        </div>
    )
}
