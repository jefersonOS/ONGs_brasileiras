import { createClient } from '@/lib/supabase/server'
import { CheckCircle, XCircle, Award, Calendar, User, BookOpen, Shield } from 'lucide-react'

export default async function ValidarPage({ params }: { params: { codigo: string } }) {
    const { codigo } = params
    const supabase = createClient()

    const { data: cert } = await supabase
        .from('certificados')
        .select('*, users!cidadao_id(nome, cpf), inscricoes!inscricao_id(entidade_tipo, entidade_id, turmas(*, curso:cursos(titulo, carga_horaria)))')
        .eq('codigo_validacao', codigo)
        .single()

    const valido = !!cert && cert.status === 'valido'
    const nomeCurso = cert?.inscricoes?.turmas?.curso?.titulo || 'N/D'
    const nomeAluno = cert?.users?.nome || 'N/D'
    const dataEmissao = cert?.emitido_em ? new Date(cert.emitido_em).toLocaleDateString('pt-BR') : 'N/D'
    const cargaHoraria = cert?.inscricoes?.turmas?.curso?.carga_horaria || null

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1A3C4A] to-[#0f2530] flex items-center justify-center p-6">
            <div className="bg-white rounded-[40px] shadow-2xl p-12 max-w-lg w-full text-center space-y-8">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${valido ? 'bg-green-100' : 'bg-red-100'}`}>
                    {valido ? <CheckCircle className="w-12 h-12 text-green-600" /> : <XCircle className="w-12 h-12 text-red-500" />}
                </div>

                <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${valido ? 'text-green-600' : 'text-red-500'}`}>
                        {valido ? 'Certificado Autêntico' : 'Certificado Inválido'}
                    </p>
                    <h1 className="text-3xl font-black text-[#1A3C4A]">
                        {valido ? 'Documento Válido' : 'Não Encontrado'}
                    </h1>
                </div>

                {valido && (
                    <div className="bg-gray-50 rounded-[24px] p-8 text-left space-y-4">
                        <div className="flex items-start gap-4">
                            <User className="w-5 h-5 text-[#2D9E6B] mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Beneficiário</p>
                                <p className="font-bold text-[#1A3C4A]">{nomeAluno}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <BookOpen className="w-5 h-5 text-[#2D9E6B] mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Curso / Atividade</p>
                                <p className="font-bold text-[#1A3C4A]">{nomeCurso}</p>
                                {cargaHoraria && <p className="text-sm text-gray-500">{cargaHoraria}h de carga horária</p>}
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Calendar className="w-5 h-5 text-[#2D9E6B] mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Data de Emissão</p>
                                <p className="font-bold text-[#1A3C4A]">{dataEmissao}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <Shield className="w-5 h-5 text-[#2D9E6B] mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Código de Autenticação</p>
                                <p className="font-mono font-bold text-[#1A3C4A] text-lg">{codigo}</p>
                            </div>
                        </div>
                    </div>
                )}

                {!valido && (
                    <p className="text-gray-500 text-sm">
                        O código <strong className="font-mono">{codigo}</strong> não corresponde a nenhum certificado em nossa base de dados.
                    </p>
                )}

                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                        <Award className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Nexori · Sistema de Verificação de Certificados</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
