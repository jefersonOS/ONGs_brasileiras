import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Download, CheckCircle, Clock, GraduationCap } from 'lucide-react'

export default async function MinhaAreaPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch their registrations
    const { data: inscricoes } = await supabase.from('inscricoes')
        .select(`
        id,
        status,
        created_at,
        entidade_tipo,
        entidade_id
    `)
        .eq('cidadao_id', user.id)

    // Fetch their certificates
    const { data: certificados } = await supabase.from('certificados')
        .select('*')
        .eq('cidadao_id', user.id)

    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-[#1A3C4A]">Minha Área</h1>
                <p className="text-gray-500 mt-2">Bem-vindo, {user.user_metadata?.nome}. Acompanhe suas inscrições e certificados.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Inscrições */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Minhas Inscrições
                    </h2>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {inscricoes && inscricoes.length > 0 ? (
                            <ul className="divide-y divide-gray-100">
                                {inscricoes.map(insc => (
                                    <li key={insc.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-800">
                                                ID Referência: {insc.entidade_id.substring(0, 8)}...
                                            </h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                Tipo: <span className="uppercase text-xs font-bold bg-gray-200 px-2 py-0.5 rounded">{insc.entidade_tipo}</span>
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${insc.status === 'confirmada' ? 'bg-green-100 text-green-700' :
                                                insc.status === 'pendente' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {insc.status === 'confirmada' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                                {insc.status.toUpperCase()}
                                            </span>
                                            <p className="text-xs text-gray-400 mt-2">Inscrito em {new Date(insc.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-12 text-center text-gray-500">
                                Você ainda não se inscreveu em nenhum curso ou atividade.
                            </div>
                        )}
                    </div>
                </div>

                {/* Certificados */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-800">Meus Certificados</h2>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        {certificados && certificados.length > 0 ? (
                            <div className="space-y-4">
                                {certificados.map(cert => (
                                    <div key={cert.id} className="border border-green-100 bg-green-50 p-4 rounded-lg flex items-start gap-4">
                                        <div className="bg-[#2D9E6B] text-white p-2 rounded-md shrink-0">
                                            <GraduationCap className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-gray-800 leading-tight">Certificado de Conclusão</h4>
                                            <p className="text-xs text-gray-500 mt-1 mb-3">Emitido em: {new Date(cert.emitido_em).toLocaleDateString()}</p>
                                            <button className="text-xs font-semibold text-[#1A3C4A] hover:text-[#2D9E6B] flex items-center gap-1">
                                                <Download className="w-3 h-3" /> Baixar PDF
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-sm text-gray-500 py-6">
                                Nenhum certificado disponível ainda.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
// Note: Removed the local GraduationCap import from lucide-react above since it wasn't added to that file originally. Wait, I'll let Next.js auto-resolve or I should import it.
