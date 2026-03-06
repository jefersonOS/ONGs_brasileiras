import { createClient } from '@/lib/supabase/server'
import { ShieldCheck, XOctagon, FileText, User, Calendar, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function ValidadorAutenticidadePage({ params }: { params: { codigo: string } }) {
    const supabase = createClient()
    const codigo = params.codigo

    const { data: certificado, error } = await supabase
        .from('certificados')
        .select(`
            *,
            users!cidadao_id (nome, cpf),
            inscricoes!inscricao_id (
                entidade_tipo,
                entidade_id
            )
        `)
        .eq('codigo_validacao', codigo)
        .single()

    if (error && error.code !== 'PGRST116') {
        console.error(error)
    }

    const isValid = !!certificado && certificado.status === 'valido'
    const isCancelled = !!certificado && certificado.status === 'cancelado'

    let tituloEntidade = 'Evento Indefinido'

    if (certificado && certificado.inscricoes.entidade_tipo === 'curso') {
        const { data: curso } = await supabase.from('cursos').select('titulo').eq('id', certificado.inscricoes.entidade_id).single()
        if (curso) tituloEntidade = curso.titulo
    } else if (certificado && certificado.inscricoes.entidade_tipo === 'atividade') {
        const { data: atividade } = await supabase.from('atividades').select('titulo').eq('id', certificado.inscricoes.entidade_id).single()
        if (atividade) tituloEntidade = atividade.titulo
    }

    // Mascara simples para o CPF publico parcial
    const maskCpf = (cpf: string) => {
        if (!cpf || cpf.length < 11) return '***.***.***-**'
        return `***.${cpf.substring(3, 6)}.***-${cpf.substring(9, 11)}`
    }

    return (
        <div className="min-h-screen bg-[#F5F7F8] flex flex-col items-center justify-center p-6">
            <div className="mb-8 text-center">
                <Link href="/" className="text-2xl font-black text-[#1A3C4A] tracking-tight">Nexori</Link>
                <p className="text-gray-500 text-sm mt-1 uppercase font-semibold tracking-widest">Portal de Validação</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden">
                {/* Status Bar */}
                <div className={`h-2 w-full ${isValid ? 'bg-[#2D9E6B]' : (isCancelled ? 'bg-orange-500' : 'bg-red-500')}`}></div>

                <div className="p-8">
                    {!certificado && (
                        <div className="text-center py-6">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <XOctagon className="w-10 h-10 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Documento Não Encontrado</h2>
                            <p className="text-gray-600 mb-6">O código <strong>{codigo}</strong> não consta em nossos registros de documentos emitidos.</p>
                        </div>
                    )}

                    {isCancelled && (
                        <div className="text-center py-6">
                            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertTriangle className="w-10 h-10 text-orange-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Documento Cancelado</h2>
                            <p className="text-gray-600 mb-6">Este documento consta na base de dados, porém seu status atual é <strong>revogado ou cancelado</strong> pela instituição emissora.</p>
                        </div>
                    )}

                    {isValid && (
                        <div>
                            <div className="text-center mb-10">
                                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck className="w-12 h-12 text-[#2D9E6B]" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-1">Documento Válido e Autêntico</h1>
                                <p className="text-[#2D9E6B] font-medium text-sm flex items-center justify-center gap-1">
                                    Assinatura criptográfica verificada
                                </p>
                            </div>

                            <div className="space-y-4 text-sm bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <div className="flex items-start gap-3">
                                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Titular do Documento</p>
                                        <p className="font-semibold text-gray-800 text-base">{certificado.users?.nome || 'N/A'}</p>
                                        <p className="text-gray-600">CPF: {maskCpf(certificado.users?.cpf || '')}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
                                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Referência ({certificado.tipo})</p>
                                        <p className="font-semibold text-gray-800 text-base">{tituloEntidade}</p>
                                        <p className="text-gray-600 uppercase text-xs mt-1">Modalidade: {certificado.inscricoes.entidade_tipo}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
                                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Data de Emissão</p>
                                        <p className="font-semibold text-gray-800">{new Date(certificado.emitido_em).toLocaleDateString('pt-BR')} às {new Date(certificado.emitido_em).toLocaleTimeString('pt-BR')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <Link href="/" className="text-sm font-medium text-[#2E6B7A] hover:underline">
                            Acessar Portal da ONG
                        </Link>
                    </div>
                </div>
            </div>

            <p className="text-xs text-center text-gray-400 mt-8 max-w-sm">
                A falsificação deste documento e/ou o uso indevido constitui crime previsto no Código Penal Brasileiro. O código de validação atesta exclusivamente as informações expostas em tela.
            </p>
        </div>
    )
}
