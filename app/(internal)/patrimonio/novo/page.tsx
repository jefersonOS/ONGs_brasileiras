'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'

export default function NovoBemPage() {
    const router = useRouter()
    const supabase = createClient()

    // Form States
    const [tombamento, setTombamento] = useState(`TMB-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`)
    const [descricao, setDescricao] = useState('')
    const [categoria, setCategoria] = useState('equipamento')
    const [subcategoria, setSubcategoria] = useState('')
    const [marca, setMarca] = useState('')
    const [modelo, setModelo] = useState('')
    const [numeroSerie, setNumeroSerie] = useState('')

    // Financial States
    const [valorAquisicao, setValorAquisicao] = useState<number | ''>('')
    const [dataAquisicao, setDataAquisicao] = useState('')
    const [fonteRecurso, setFonteRecurso] = useState('proprio')
    const [vidaUtil, setVidaUtil] = useState<number | ''>('')
    const [depreciacaoAnual, setDepreciacaoAnual] = useState<number | ''>('')

    // Status States
    const [localizacao, setLocalizacao] = useState('')
    const [estadoConservacao, setEstadoConservacao] = useState('bom')
    const [status, setStatus] = useState('ativo')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()

        // Generate dummy QR Code URL for the sake of the MVP
        const qrcodeUrl = `https://nexori.app/q/${tombamento}`

        const { error: insertError } = await supabase.from('patrimonio_bens').insert({
            tenant_id: user?.user_metadata?.tenant_id,
            tombamento,
            descricao,
            categoria,
            subcategoria,
            marca,
            modelo,
            numero_serie: numeroSerie,
            valor_aquisicao: valorAquisicao || 0,
            data_aquisicao: dataAquisicao || null,
            fonte_recurso: fonteRecurso,
            vida_util: vidaUtil || 0,
            depreciacao_anual: depreciacaoAnual || 0,
            valor_atual: valorAquisicao || 0, // initially, current val = acquisition val
            localizacao,
            estado_conservacao: estadoConservacao,
            status,
            qrcode_url: qrcodeUrl
        })

        if (insertError) {
            setError(insertError.message)
            setLoading(false)
            return
        }

        // Generate actual QR Code via API
        try {
            await fetch('/api/patrimonio/qrcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tombamento, tenantId: user?.user_metadata?.tenant_id })
            })
        } catch (e) {
            console.error('QR Generation failed:', e)
        }

        router.push('/patrimonio')
        router.refresh()
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-[#1A3C4A]">Cadastrar Bem</h1>
                <p className="text-gray-500 mt-1">Registre um novo item no controle de patrimônio da ONG.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {error && <div className="p-3 mb-6 bg-red-100 text-red-600 rounded-md text-sm">{error}</div>}

                <form onSubmit={handleCreate} className="space-y-8">
                    {/* Identificação Básica */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Identificação Básica</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Tombamento *</label>
                                <input type="text" value={tombamento} onChange={e => setTombamento(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                                <select value={categoria} onChange={e => setCategoria(e.target.value)} required className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]">
                                    <option value="movel">Móvel</option>
                                    <option value="imovel">Imóvel</option>
                                    <option value="equipamento">Equipamento</option>
                                    <option value="veiculo">Veículo</option>
                                    <option value="informatica">Informática</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Bem *</label>
                                <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" placeholder="Ex: Notebook Dell Inspiron 15" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                                <input type="text" value={marca} onChange={e => setMarca(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                                <input type="text" value={modelo} onChange={e => setModelo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Série</label>
                                <input type="text" value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subcategoria</label>
                                <input type="text" value={subcategoria} onChange={e => setSubcategoria(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                            </div>
                        </div>
                    </div>

                    {/* Financeiro e Aquisição */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Aquisição e Controle</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor de Aquisição (R$)</label>
                                <input type="number" step="0.01" value={valorAquisicao} onChange={e => setValorAquisicao(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Aquisição</label>
                                <input type="date" value={dataAquisicao} onChange={e => setDataAquisicao(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fonte do Recurso</label>
                                <select value={fonteRecurso} onChange={e => setFonteRecurso(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]">
                                    <option value="proprio">Recurso Próprio</option>
                                    <option value="doacao">Doação</option>
                                    <option value="convenio">Convênio/Edital</option>
                                    <option value="emenda">Emenda Parlamentar</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vida Útil (Anos)</label>
                                <input type="number" value={vidaUtil} onChange={e => setVidaUtil(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Depreciação Anual (%)</label>
                                <input type="number" step="0.1" value={depreciacaoAnual} onChange={e => setDepreciacaoAnual(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" />
                            </div>
                        </div>
                    </div>

                    {/* Status e Localização */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">Situação Atual</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
                                <input type="text" value={localizacao} onChange={e => setLocalizacao(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]" placeholder="Ex: Sala 02 - TI" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Conservação</label>
                                <select value={estadoConservacao} onChange={e => setEstadoConservacao(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]">
                                    <option value="otimo">Ótimo</option>
                                    <option value="bom">Bom</option>
                                    <option value="regular">Regular</option>
                                    <option value="ruim">Ruim</option>
                                    <option value="inservivel">Inservível</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status de Operação</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md focus:outline-none focus:ring-[#2D9E6B] focus:border-[#2D9E6B]">
                                    <option value="ativo">Ativo / Em uso</option>
                                    <option value="manutencao">Em Manutenção</option>
                                    <option value="baixado">Baixado / Alienado</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Preview QR Code */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex items-start gap-6">
                        <div className="bg-white p-2 rounded shadow-sm">
                            <QRCodeSVG value={`https://nexori.app/q/${tombamento}`} size={100} />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-800 mb-1">Geração de Etiqueta</h4>
                            <p className="text-sm text-gray-500 max-w-sm">O QR Code para este bem será gerado automaticamente. Você poderá imprimir as etiquetas diretamente da página de listagem.</p>
                            <div className="mt-3 text-sm font-mono bg-white inline-block px-2 py-1 rounded border border-gray-200">
                                {tombamento}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 flex items-center justify-end gap-3">
                        <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-[#2D9E6B] text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50">
                            {loading ? 'Cadastrando...' : 'Cadastrar Bem'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
