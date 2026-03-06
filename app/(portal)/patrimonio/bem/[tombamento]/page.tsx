import { createClient } from '@/lib/supabase/server'
import { MapPin, Tag, ShieldCheck, AlertTriangle, QrCode } from 'lucide-react'
import { clsx } from 'clsx'
import Image from 'next/image'
import { OcorrenciaForm } from '@/components/patrimonio/OcorrenciaForm'

export default async function PublicBemPage({ params }: { params: { tombamento: string } }) {
    const supabase = createClient()
    const { tombamento } = params

    const { data: bem } = await supabase
        .from('patrimonio_bens')
        .select('*')
        .eq('tombamento', tombamento)
        .single()

    if (!bem) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-black text-[#1A3C4A]">Bem não encontrado</h1>
                <p className="text-gray-500 mt-2">O código de tombamento informado não existe em nossa base de dados.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header Visual */}
            <div className="bg-[#1A3C4A] text-white p-8 pt-12 rounded-b-[40px] shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-teal-400 text-[10px] font-black uppercase tracking-widest mb-2">
                        <Tag className="w-3 h-3" /> Patrimônio Oficial
                    </div>
                    <h1 className="text-3xl font-black leading-tight">{bem.descricao}</h1>
                    <div className="mt-4 inline-block bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/20">
                        <code className="text-sm font-bold text-teal-300 tracking-widest">{bem.tombamento}</code>
                    </div>
                </div>
                <div className="absolute -bottom-10 -right-10 opacity-5">
                    <ShieldCheck className="w-64 h-64 text-white" />
                </div>
            </div>

            <div className="max-w-md mx-auto px-6 -mt-8 space-y-4">
                {/* Card de Status */}
                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-teal-900/5 border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Estado de Conservação</p>
                        <p className="text-lg font-bold text-[#1A3C4A] capitalize">{bem.estado_conservacao}</p>
                    </div>
                    <div className={clsx(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        bem.estado_conservacao === 'otimo' || bem.estado_conservacao === 'bom' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                    )}>
                        {bem.qrcode_url && <img src={bem.qrcode_url} alt="QR Code" className="w-full h-full object-contain" />}
                    </div>
                </div>

                {/* Detalhes */}
                <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50">
                        <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest mb-4">Informações do Item</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Localização Atual</p>
                                    <p className="text-sm font-semibold text-gray-800">{bem.localizacao || 'Não informada'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="relative w-full aspect-square bg-white p-2 rounded-2xl shadow-inner border border-gray-100 flex items-center justify-center">
                                    {bem.qrcode_url ? (
                                        <Image
                                            src={bem.qrcode_url}
                                            alt="QR Code do Bem"
                                            fill
                                            className="object-contain p-2"
                                        />
                                    ) : (
                                        <QrCode className="w-20 h-20 text-gray-200" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Responsável</p>
                                    <p className="text-sm font-semibold text-gray-800">{bem.responsavel || 'Equipe Geral'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400">
                                    <Tag className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Categoria</p>
                                    <p className="text-sm font-semibold text-gray-800 capitalize">{bem.categoria}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reportar Área */}
                    <div className="p-8 bg-red-50/50">
                        <div className="flex items-center gap-3 mb-4 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            <h3 className="font-bold">Reportar Ocorrência</h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-6">Encontrou algum defeito ou precisa de manutenção neste item? Informe abaixo.</p>

                        <OcorrenciaForm tombamento={bem.tombamento} />
                    </div>
                </div>

                <div className="text-center pt-8">
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-tighter">Powered by Nexori Platform</p>
                </div>
            </div>
        </div>
    )
}
