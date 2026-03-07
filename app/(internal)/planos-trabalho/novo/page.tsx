'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'

type DadosEntidade = { nome: string; razao_social: string; cnpj: string; endereco: string; cidade: string; uf: string; cep: string; telefone: string; email: string }
type RepresentanteLegal = { nome: string; cpf: string; rg: string; cargo: string; inicio_mandato: string; termino_mandato: string; endereco: string; cidade: string; uf: string; cep: string; telefone: string; email: string }
type ResponsavelTecnico = { nome: string; cpf: string; rg: string; escolaridade: string; endereco: string; cidade: string; uf: string; cep: string; telefone: string; email: string }
type RecursoHumano = { nome: string; formacao: string; funcao: string; carga_horaria: string }
type MetaAtividade = { meta: string; atividades: string; inicio: string; termino: string; valor: string; parametro: string }
type DespesaItem = { item: string; num_atividade: string; natureza_despesa: string; unidade: string; qtde: string; valor_unitario: string; valor_total: string }

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#2D9E6B] focus:border-[#2D9E6B]'
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1'

function SectionHeader({ number, title, open, onToggle }: { number: string; title: string; open: boolean; onToggle: () => void }) {
    return (
        <button type="button" onClick={onToggle} className="w-full flex items-center justify-between bg-[#1A3C4A] text-white px-4 py-3 rounded-md font-bold text-sm">
            <span>{number}. {title}</span>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
    )
}

function NovoPlanoForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()

    const [projetos, setProjetos] = useState<{ id: string; nome: string }[]>([])
    const [projetoId, setProjetoId] = useState('')
    const [titulo, setTitulo] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isAIGenerated, setIsAIGenerated] = useState(false)

    // Section open/close state
    const [open, setOpen] = useState<Record<string, boolean>>({ s1: true, s2: true, s3: true, s4: true, s5: true, s6: true, s7: true, s8: true, s9: true })
    const toggle = (key: string) => setOpen(prev => ({ ...prev, [key]: !prev[key] }))

    // 1.1 Dados da Entidade
    const [entidade, setEntidade] = useState<DadosEntidade>({ nome: '', razao_social: '', cnpj: '', endereco: '', cidade: '', uf: '', cep: '', telefone: '', email: '' })

    // 1.2 Representante Legal
    const [representante, setRepresentante] = useState<RepresentanteLegal>({ nome: '', cpf: '', rg: '', cargo: '', inicio_mandato: '', termino_mandato: '', endereco: '', cidade: '', uf: '', cep: '', telefone: '', email: '' })

    // 1.3 Responsável Técnico
    const [responsavel, setResponsavel] = useState<ResponsavelTecnico>({ nome: '', cpf: '', rg: '', escolaridade: '', endereco: '', cidade: '', uf: '', cep: '', telefone: '', email: '' })

    // 1.4 Origem dos Recursos
    const [origemRecursos, setOrigemRecursos] = useState('')
    const [valorProposta, setValorProposta] = useState<number | ''>('')

    // 2. Apresentação da OSC
    const [apresentacao, setApresentacao] = useState('')

    // 3. Objeto
    const [objeto, setObjeto] = useState('')
    const [tempoExecucao, setTempoExecucao] = useState('')
    const [publicoAlvo, setPublicoAlvo] = useState('')
    const [abrangencia, setAbrangencia] = useState('')

    // 4. Justificativa
    const [justificativa, setJustificativa] = useState('')

    // 5. Metodologia
    const [metodologia, setMetodologia] = useState('')

    // 6. Sustentabilidade
    const [sustentabilidade, setSustentabilidade] = useState('')

    // 7. Capacidade Técnica
    const [capacidadeTecnica, setCapacidadeTecnica] = useState('')

    // 8.1 Recursos Humanos
    const [recursosHumanos, setRecursosHumanos] = useState<RecursoHumano[]>([{ nome: '', formacao: '', funcao: '', carga_horaria: '' }])

    // 8.2 Espaço Físico
    const [espacoFisico, setEspacoFisico] = useState('')

    // 8. Metas e Atividades
    const [metasAtividades, setMetasAtividades] = useState<MetaAtividade[]>([{ meta: '', atividades: '', inicio: '', termino: '', valor: '', parametro: '' }])

    // 9. Plano de Aplicação
    const [despesas, setDespesas] = useState<DespesaItem[]>([{ item: '1', num_atividade: '', natureza_despesa: '', unidade: '', qtde: '', valor_unitario: '', valor_total: '' }])

    // AI Modal
    const [showAIModal, setShowAIModal] = useState(false)
    const [ideiaCentral, setIdeiaCentral] = useState('')
    const [generating, setGenerating] = useState(false)

    // Refine Field
    const [refiningField, setRefiningField] = useState<{ name: string; value: string; setter: (v: string) => void } | null>(null)
    const [isRefining, setIsRefining] = useState(false)

    useEffect(() => {
        supabase.from('projetos').select('id, nome').eq('status', 'ativo').then(({ data }) => {
            if (data) setProjetos(data)
        })
        if (searchParams.get('ai') === 'true') setShowAIModal(true)
    }, [supabase, searchParams])

    const totalDespesas = despesas.reduce((sum, d) => sum + (parseFloat(d.valor_total) || 0), 0)

    const handleCreate = async (isDraft: boolean) => {
        setLoading(true)
        setError(null)

        const { data: { user } } = await supabase.auth.getUser()

        const dados_template = {
            identificacao: {
                dados_entidade: entidade,
                representante_legal: representante,
                responsavel_tecnico: responsavel,
                origem_recursos: origemRecursos,
                valor_proposta: Number(valorProposta) || 0,
            },
            apresentacao_osc: apresentacao,
            objeto: { descricao: objeto, tempo_execucao: tempoExecucao, publico_alvo: publicoAlvo, abrangencia_geografica: abrangencia },
            metodologia,
            sustentabilidade,
            capacidade_tecnica: capacidadeTecnica,
            recursos_humanos: recursosHumanos,
            espaco_fisico: espacoFisico,
            metas_atividades: metasAtividades,
            plano_aplicacao: despesas,
        }

        const { error: insertError } = await supabase.from('planos_trabalho').insert({
            tenant_id: user?.user_metadata?.tenant_id,
            projeto_id: projetoId || null,
            criador_id: user?.id,
            titulo: titulo || entidade.nome || 'Plano de Trabalho',
            descricao: apresentacao,
            justificativa,
            orcamento_estimado: totalDespesas || Number(valorProposta) || 0,
            status: isDraft ? 'rascunho' : 'enviado',
            gerado_por_ia: isAIGenerated,
            dados_template,
        })

        if (insertError) {
            setError(insertError.message)
            setLoading(false)
            return
        }

        router.push('/planos-trabalho')
        router.refresh()
    }

    const handleAI = async () => {
        if (!ideiaCentral) return
        setGenerating(true)
        try {
            const res = await fetch('/api/ia/gerar-plano', {
                method: 'POST',
                body: JSON.stringify({ ideiaCentral })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            setTitulo(data.titulo || '')
            setApresentacao(data.descricao || '')
            setObjeto(data.titulo || '')
            setJustificativa(data.justificativa || '')
            if (data.publico_alvo) setPublicoAlvo(data.publico_alvo)
            if (data.metas && Array.isArray(data.metas)) {
                setMetasAtividades(data.metas.map((m: any) => ({
                    meta: m.indicador || m.descricao || '',
                    atividades: m.descricao || '',
                    inicio: m.prazo || '',
                    termino: '',
                    valor: '',
                    parametro: m.indicador || ''
                })))
            }
            if (data.cronograma && Array.isArray(data.cronograma)) {
                setDespesas(data.cronograma.map((c: any, i: number) => ({
                    item: String(i + 1),
                    num_atividade: String(i + 1),
                    natureza_despesa: c.atividades || c.fase || '',
                    unidade: '',
                    qtde: '',
                    valor_unitario: '',
                    valor_total: ''
                })))
            }
            if (data.orcamento_estimado) setValorProposta(data.orcamento_estimado)
            setIsAIGenerated(true)
            setShowAIModal(false)
        } catch (err: unknown) {
            alert('Erro ao gerar com IA: ' + (err instanceof Error ? err.message : String(err)))
        } finally {
            setGenerating(false)
        }
    }

    const handleRefineField = async () => {
        if (!refiningField) return
        setIsRefining(true)
        try {
            const res = await fetch('/api/ia/refinar-campo', {
                method: 'POST',
                body: JSON.stringify({ campo: refiningField.name, valorAtual: refiningField.value, contexto: ideiaCentral || titulo })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            refiningField.setter(data.refinado)
            setRefiningField(null)
        } catch (err: any) {
            alert('Erro ao refinar: ' + err.message)
        } finally {
            setIsRefining(false)
        }
    }

    const RefineBtn = ({ fieldName, value, setter }: { fieldName: string; value: string; setter: (v: string) => void }) => (
        <button type="button" onClick={() => setRefiningField({ name: fieldName, value, setter })} className="p-1 text-gray-400 hover:text-[#2D9E6B]" title="Refinar com IA">
            <Sparkles className="w-3.5 h-3.5" />
        </button>
    )

    return (
        <div className="max-w-5xl mx-auto space-y-4 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A3C4A]">Plano de Trabalho</h1>
                    <p className="text-gray-500 mt-1 text-sm">Preencha as seções abaixo conforme o modelo oficial.</p>
                </div>
                <button onClick={() => setShowAIModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1A3C4A] text-white rounded-md hover:bg-[#2E6B7A] text-sm shadow-sm">
                    <Sparkles className="w-4 h-4 text-[#2D9E6B]" /> Gerar com IA
                </button>
            </div>

            {isAIGenerated && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-3 text-amber-800 text-sm">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    Estrutura gerada pela IA — revise e complemente os campos antes de enviar.
                </div>
            )}

            {error && <div className="p-3 bg-red-100 text-red-600 rounded-md text-sm">{error}</div>}

            {/* Projeto Vinculado */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Título do Plano</label>
                        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} className={inputCls} placeholder="Ex: Projeto de Inclusão Digital..." />
                    </div>
                    <div>
                        <label className={labelCls}>Projeto Vinculado</label>
                        <select value={projetoId} onChange={e => setProjetoId(e.target.value)} className={inputCls + ' bg-white'}>
                            <option value="">Selecione um projeto...</option>
                            {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 1 — IDENTIFICAÇÃO DA OSC */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <SectionHeader number="1" title="IDENTIFICAÇÃO DA OSC" open={open.s1} onToggle={() => toggle('s1')} />
                {open.s1 && (
                    <div className="p-4 space-y-6">
                        {/* 1.1 */}
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">1.1 Dados da Entidade</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div><label className={labelCls}>Nome</label><input className={inputCls} value={entidade.nome} onChange={e => setEntidade({ ...entidade, nome: e.target.value })} /></div>
                                <div><label className={labelCls}>Razão Social</label><input className={inputCls} value={entidade.razao_social} onChange={e => setEntidade({ ...entidade, razao_social: e.target.value })} /></div>
                                <div><label className={labelCls}>CNPJ</label><input className={inputCls} value={entidade.cnpj} onChange={e => setEntidade({ ...entidade, cnpj: e.target.value })} /></div>
                                <div><label className={labelCls}>Endereço</label><input className={inputCls} value={entidade.endereco} onChange={e => setEntidade({ ...entidade, endereco: e.target.value })} /></div>
                                <div><label className={labelCls}>Cidade</label><input className={inputCls} value={entidade.cidade} onChange={e => setEntidade({ ...entidade, cidade: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className={labelCls}>UF</label><input className={inputCls} maxLength={2} value={entidade.uf} onChange={e => setEntidade({ ...entidade, uf: e.target.value.toUpperCase() })} /></div>
                                    <div><label className={labelCls}>CEP</label><input className={inputCls} value={entidade.cep} onChange={e => setEntidade({ ...entidade, cep: e.target.value })} /></div>
                                </div>
                                <div><label className={labelCls}>Telefone</label><input className={inputCls} value={entidade.telefone} onChange={e => setEntidade({ ...entidade, telefone: e.target.value })} /></div>
                                <div><label className={labelCls}>E-mail</label><input className={inputCls} type="email" value={entidade.email} onChange={e => setEntidade({ ...entidade, email: e.target.value })} /></div>
                            </div>
                        </div>

                        {/* 1.2 */}
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">1.2 Dados do Representante Legal</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div><label className={labelCls}>Nome Completo</label><input className={inputCls} value={representante.nome} onChange={e => setRepresentante({ ...representante, nome: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className={labelCls}>CPF</label><input className={inputCls} value={representante.cpf} onChange={e => setRepresentante({ ...representante, cpf: e.target.value })} /></div>
                                    <div><label className={labelCls}>RG / Órgão Expedidor</label><input className={inputCls} value={representante.rg} onChange={e => setRepresentante({ ...representante, rg: e.target.value })} /></div>
                                </div>
                                <div><label className={labelCls}>Cargo</label><input className={inputCls} value={representante.cargo} onChange={e => setRepresentante({ ...representante, cargo: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className={labelCls}>Início do Mandato</label><input className={inputCls} type="date" value={representante.inicio_mandato} onChange={e => setRepresentante({ ...representante, inicio_mandato: e.target.value })} /></div>
                                    <div><label className={labelCls}>Término do Mandato</label><input className={inputCls} type="date" value={representante.termino_mandato} onChange={e => setRepresentante({ ...representante, termino_mandato: e.target.value })} /></div>
                                </div>
                                <div><label className={labelCls}>Endereço</label><input className={inputCls} value={representante.endereco} onChange={e => setRepresentante({ ...representante, endereco: e.target.value })} /></div>
                                <div><label className={labelCls}>Cidade</label><input className={inputCls} value={representante.cidade} onChange={e => setRepresentante({ ...representante, cidade: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className={labelCls}>UF</label><input className={inputCls} maxLength={2} value={representante.uf} onChange={e => setRepresentante({ ...representante, uf: e.target.value.toUpperCase() })} /></div>
                                    <div><label className={labelCls}>CEP</label><input className={inputCls} value={representante.cep} onChange={e => setRepresentante({ ...representante, cep: e.target.value })} /></div>
                                </div>
                                <div><label className={labelCls}>Telefone</label><input className={inputCls} value={representante.telefone} onChange={e => setRepresentante({ ...representante, telefone: e.target.value })} /></div>
                                <div><label className={labelCls}>E-mail</label><input className={inputCls} type="email" value={representante.email} onChange={e => setRepresentante({ ...representante, email: e.target.value })} /></div>
                            </div>
                        </div>

                        {/* 1.3 */}
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">1.3 Responsável Técnico pelo Projeto</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div><label className={labelCls}>Nome Completo</label><input className={inputCls} value={responsavel.nome} onChange={e => setResponsavel({ ...responsavel, nome: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className={labelCls}>CPF</label><input className={inputCls} value={responsavel.cpf} onChange={e => setResponsavel({ ...responsavel, cpf: e.target.value })} /></div>
                                    <div><label className={labelCls}>RG / Órgão Expedidor</label><input className={inputCls} value={responsavel.rg} onChange={e => setResponsavel({ ...responsavel, rg: e.target.value })} /></div>
                                </div>
                                <div><label className={labelCls}>Nível de Escolaridade</label><input className={inputCls} value={responsavel.escolaridade} onChange={e => setResponsavel({ ...responsavel, escolaridade: e.target.value })} /></div>
                                <div><label className={labelCls}>Endereço</label><input className={inputCls} value={responsavel.endereco} onChange={e => setResponsavel({ ...responsavel, endereco: e.target.value })} /></div>
                                <div><label className={labelCls}>Cidade</label><input className={inputCls} value={responsavel.cidade} onChange={e => setResponsavel({ ...responsavel, cidade: e.target.value })} /></div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div><label className={labelCls}>UF</label><input className={inputCls} maxLength={2} value={responsavel.uf} onChange={e => setResponsavel({ ...responsavel, uf: e.target.value.toUpperCase() })} /></div>
                                    <div><label className={labelCls}>CEP</label><input className={inputCls} value={responsavel.cep} onChange={e => setResponsavel({ ...responsavel, cep: e.target.value })} /></div>
                                </div>
                                <div><label className={labelCls}>Telefone</label><input className={inputCls} value={responsavel.telefone} onChange={e => setResponsavel({ ...responsavel, telefone: e.target.value })} /></div>
                                <div><label className={labelCls}>E-mail</label><input className={inputCls} type="email" value={responsavel.email} onChange={e => setResponsavel({ ...responsavel, email: e.target.value })} /></div>
                            </div>
                        </div>

                        {/* 1.4 */}
                        <div>
                            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">1.4 Origem dos Recursos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div><label className={labelCls}>Origem</label><input className={inputCls} value={origemRecursos} onChange={e => setOrigemRecursos(e.target.value)} placeholder="Ex: Municipal, Estadual, Federal..." /></div>
                                <div><label className={labelCls}>Valor da Proposta (R$)</label><input className={inputCls} type="number" step="0.01" value={valorProposta} onChange={e => setValorProposta(Number(e.target.value))} /></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* SEÇÃO 2 — APRESENTAÇÃO DA OSC */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <SectionHeader number="2" title="APRESENTAÇÃO DA OSC" open={open.s2} onToggle={() => toggle('s2')} />
                {open.s2 && (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                            <label className={labelCls}>Descreva a organização, histórico e missão</label>
                            <RefineBtn fieldName="Apresentação da OSC" value={apresentacao} setter={setApresentacao} />
                        </div>
                        <textarea rows={6} className={inputCls} value={apresentacao} onChange={e => setApresentacao(e.target.value)} />
                    </div>
                )}
            </div>

            {/* SEÇÃO 3 — OBJETO */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <SectionHeader number="3" title="OBJETO" open={open.s3} onToggle={() => toggle('s3')} />
                {open.s3 && (
                    <div className="p-4 space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className={labelCls}>Descrição do Objeto</label>
                                <RefineBtn fieldName="Objeto" value={objeto} setter={setObjeto} />
                            </div>
                            <textarea rows={3} className={inputCls} value={objeto} onChange={e => setObjeto(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div><label className={labelCls}>Tempo de Execução</label><input className={inputCls} value={tempoExecucao} onChange={e => setTempoExecucao(e.target.value)} placeholder="Ex: 12 meses" /></div>
                            <div><label className={labelCls}>Público-Alvo e nº de beneficiados</label><input className={inputCls} value={publicoAlvo} onChange={e => setPublicoAlvo(e.target.value)} placeholder="Ex: 100 crianças de 6-12 anos" /></div>
                            <div><label className={labelCls}>Abrangência Geográfica</label><input className={inputCls} value={abrangencia} onChange={e => setAbrangencia(e.target.value)} placeholder="Ex: Município de São Paulo - SP" /></div>
                        </div>
                    </div>
                )}
            </div>

            {/* SEÇÃO 4 — JUSTIFICATIVA */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <SectionHeader number="4" title="JUSTIFICATIVA" open={open.s4} onToggle={() => toggle('s4')} />
                {open.s4 && (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                            <label className={labelCls}>Justificativa da proposta</label>
                            <RefineBtn fieldName="Justificativa" value={justificativa} setter={setJustificativa} />
                        </div>
                        <textarea rows={6} className={inputCls} value={justificativa} onChange={e => setJustificativa(e.target.value)} />
                    </div>
                )}
            </div>

            {/* SEÇÃO 5 — METODOLOGIA */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <SectionHeader number="5" title="METODOLOGIA" open={open.s5} onToggle={() => toggle('s5')} />
                {open.s5 && (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                            <label className={labelCls}>Descreva a metodologia de execução</label>
                            <RefineBtn fieldName="Metodologia" value={metodologia} setter={setMetodologia} />
                        </div>
                        <textarea rows={6} className={inputCls} value={metodologia} onChange={e => setMetodologia(e.target.value)} />
                    </div>
                )}
            </div>

            {/* SEÇÃO 6 — SUSTENTABILIDADE */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <SectionHeader number="6" title="SUSTENTABILIDADE DA PROPOSTA" open={open.s6} onToggle={() => toggle('s6')} />
                {open.s6 && (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-1">
                            <label className={labelCls}>Como o projeto será sustentado após o encerramento do convênio</label>
                            <RefineBtn fieldName="Sustentabilidade" value={sustentabilidade} setter={setSustentabilidade} />
                        </div>
                        <textarea rows={5} className={inputCls} value={sustentabilidade} onChange={e => setSustentabilidade(e.target.value)} />
                    </div>
                )}
            </div>

            {/* SEÇÃO 7 — CAPACIDADE TÉCNICA */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <SectionHeader number="7" title="CAPACIDADE TÉCNICA E GERENCIAL" open={open.s7} onToggle={() => toggle('s7')} />
                {open.s7 && (
                    <div className="p-4 space-y-6">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className={labelCls}>Descrição da capacidade técnica e gerencial da OSC</label>
                                <RefineBtn fieldName="Capacidade Técnica" value={capacidadeTecnica} setter={setCapacidadeTecnica} />
                            </div>
                            <textarea rows={4} className={inputCls} value={capacidadeTecnica} onChange={e => setCapacidadeTecnica(e.target.value)} />
                        </div>

                        {/* 8.1 Recursos Humanos */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">8.1 Recursos Humanos Disponíveis</h3>
                                <button type="button" onClick={() => setRecursosHumanos([...recursosHumanos, { nome: '', formacao: '', funcao: '', carga_horaria: '' }])} className="text-xs text-[#2D9E6B] font-semibold flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Adicionar Pessoa
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">Nome</th>
                                            <th className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">Formação</th>
                                            <th className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">Função na Entidade</th>
                                            <th className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">Ch. Semanal</th>
                                            <th className="border border-gray-200 px-2 py-2 w-8"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recursosHumanos.map((rh, i) => (
                                            <tr key={i}>
                                                <td className="border border-gray-200 p-1"><input className="w-full px-2 py-1 text-xs border-none focus:outline-none" value={rh.nome} onChange={e => { const n = [...recursosHumanos]; n[i].nome = e.target.value; setRecursosHumanos(n) }} /></td>
                                                <td className="border border-gray-200 p-1"><input className="w-full px-2 py-1 text-xs border-none focus:outline-none" value={rh.formacao} onChange={e => { const n = [...recursosHumanos]; n[i].formacao = e.target.value; setRecursosHumanos(n) }} /></td>
                                                <td className="border border-gray-200 p-1"><input className="w-full px-2 py-1 text-xs border-none focus:outline-none" value={rh.funcao} onChange={e => { const n = [...recursosHumanos]; n[i].funcao = e.target.value; setRecursosHumanos(n) }} /></td>
                                                <td className="border border-gray-200 p-1"><input className="w-24 px-2 py-1 text-xs border-none focus:outline-none" value={rh.carga_horaria} onChange={e => { const n = [...recursosHumanos]; n[i].carga_horaria = e.target.value; setRecursosHumanos(n) }} /></td>
                                                <td className="border border-gray-200 p-1 text-center"><button type="button" onClick={() => setRecursosHumanos(recursosHumanos.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 8.2 Espaço Físico */}
                        <div>
                            <label className={labelCls}>8.2 Espaço Físico</label>
                            <textarea rows={3} className={inputCls} value={espacoFisico} onChange={e => setEspacoFisico(e.target.value)} placeholder="Descreva o espaço físico disponível para execução do projeto..." />
                        </div>
                    </div>
                )}
            </div>

            {/* SEÇÃO 8 — METAS E ATIVIDADES */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <SectionHeader number="8" title="METAS E ATIVIDADES" open={open.s8} onToggle={() => toggle('s8')} />
                {open.s8 && (
                    <div className="p-4">
                        <div className="flex justify-end mb-3">
                            <button type="button" onClick={() => setMetasAtividades([...metasAtividades, { meta: '', atividades: '', inicio: '', termino: '', valor: '', parametro: '' }])} className="text-xs text-[#2D9E6B] font-semibold flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Adicionar Meta
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">Meta</th>
                                        <th className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">Atividades</th>
                                        <th className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">Início</th>
                                        <th className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">Término</th>
                                        <th className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">Valor (R$)</th>
                                        <th className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">Parâmetro de Verificação</th>
                                        <th className="border border-gray-200 px-2 py-2 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metasAtividades.map((m, i) => (
                                        <tr key={i}>
                                            <td className="border border-gray-200 p-1"><textarea className="w-full px-2 py-1 text-xs border-none focus:outline-none resize-none" rows={2} value={m.meta} onChange={e => { const n = [...metasAtividades]; n[i].meta = e.target.value; setMetasAtividades(n) }} /></td>
                                            <td className="border border-gray-200 p-1"><textarea className="w-full px-2 py-1 text-xs border-none focus:outline-none resize-none" rows={2} value={m.atividades} onChange={e => { const n = [...metasAtividades]; n[i].atividades = e.target.value; setMetasAtividades(n) }} /></td>
                                            <td className="border border-gray-200 p-1"><input className="w-24 px-2 py-1 text-xs border-none focus:outline-none" type="date" value={m.inicio} onChange={e => { const n = [...metasAtividades]; n[i].inicio = e.target.value; setMetasAtividades(n) }} /></td>
                                            <td className="border border-gray-200 p-1"><input className="w-24 px-2 py-1 text-xs border-none focus:outline-none" type="date" value={m.termino} onChange={e => { const n = [...metasAtividades]; n[i].termino = e.target.value; setMetasAtividades(n) }} /></td>
                                            <td className="border border-gray-200 p-1"><input className="w-28 px-2 py-1 text-xs border-none focus:outline-none" type="number" step="0.01" value={m.valor} onChange={e => { const n = [...metasAtividades]; n[i].valor = e.target.value; setMetasAtividades(n) }} /></td>
                                            <td className="border border-gray-200 p-1"><textarea className="w-full px-2 py-1 text-xs border-none focus:outline-none resize-none" rows={2} value={m.parametro} onChange={e => { const n = [...metasAtividades]; n[i].parametro = e.target.value; setMetasAtividades(n) }} /></td>
                                            <td className="border border-gray-200 p-1 text-center"><button type="button" onClick={() => setMetasAtividades(metasAtividades.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* SEÇÃO 9 — PLANO DE APLICAÇÃO */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <SectionHeader number="9" title="PLANO DE APLICAÇÃO (DESPESAS)" open={open.s9} onToggle={() => toggle('s9')} />
                {open.s9 && (
                    <div className="p-4">
                        <div className="flex justify-end mb-3">
                            <button type="button" onClick={() => setDespesas([...despesas, { item: String(despesas.length + 1), num_atividade: '', natureza_despesa: '', unidade: '', qtde: '', valor_unitario: '', valor_total: '' }])} className="text-xs text-[#2D9E6B] font-semibold flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Adicionar Item
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600">Item</th>
                                        <th className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600">Nº Atividade</th>
                                        <th className="border border-gray-200 px-2 py-2 text-left text-xs font-semibold text-gray-600">Natureza da Despesa</th>
                                        <th className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600">Unidade</th>
                                        <th className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600">Qtde</th>
                                        <th className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600">Vl. Unit. (R$)</th>
                                        <th className="border border-gray-200 px-2 py-2 text-xs font-semibold text-gray-600">Vl. Total (R$)</th>
                                        <th className="border border-gray-200 px-2 py-2 w-8"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {despesas.map((d, i) => (
                                        <tr key={i}>
                                            <td className="border border-gray-200 p-1 text-center"><input className="w-10 px-1 py-1 text-xs text-center border-none focus:outline-none" value={d.item} onChange={e => { const n = [...despesas]; n[i].item = e.target.value; setDespesas(n) }} /></td>
                                            <td className="border border-gray-200 p-1 text-center"><input className="w-16 px-1 py-1 text-xs text-center border-none focus:outline-none" value={d.num_atividade} onChange={e => { const n = [...despesas]; n[i].num_atividade = e.target.value; setDespesas(n) }} /></td>
                                            <td className="border border-gray-200 p-1"><input className="w-full px-2 py-1 text-xs border-none focus:outline-none" value={d.natureza_despesa} onChange={e => { const n = [...despesas]; n[i].natureza_despesa = e.target.value; setDespesas(n) }} /></td>
                                            <td className="border border-gray-200 p-1"><input className="w-20 px-1 py-1 text-xs border-none focus:outline-none" value={d.unidade} onChange={e => { const n = [...despesas]; n[i].unidade = e.target.value; setDespesas(n) }} /></td>
                                            <td className="border border-gray-200 p-1"><input className="w-16 px-1 py-1 text-xs text-center border-none focus:outline-none" type="number" value={d.qtde} onChange={e => { const n = [...despesas]; n[i].qtde = e.target.value; setDespesas(n) }} /></td>
                                            <td className="border border-gray-200 p-1"><input className="w-24 px-1 py-1 text-xs text-right border-none focus:outline-none" type="number" step="0.01" value={d.valor_unitario} onChange={e => {
                                                const n = [...despesas]
                                                n[i].valor_unitario = e.target.value
                                                const total = (parseFloat(e.target.value) || 0) * (parseFloat(n[i].qtde) || 0)
                                                n[i].valor_total = total > 0 ? total.toFixed(2) : n[i].valor_total
                                                setDespesas(n)
                                            }} /></td>
                                            <td className="border border-gray-200 p-1"><input className="w-24 px-1 py-1 text-xs text-right border-none focus:outline-none" type="number" step="0.01" value={d.valor_total} onChange={e => { const n = [...despesas]; n[i].valor_total = e.target.value; setDespesas(n) }} /></td>
                                            <td className="border border-gray-200 p-1 text-center"><button type="button" onClick={() => setDespesas(despesas.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button></td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-bold">
                                        <td colSpan={6} className="border border-gray-200 px-3 py-2 text-xs text-right">TOTAL</td>
                                        <td className="border border-gray-200 px-2 py-2 text-xs text-right">
                                            {totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="border border-gray-200"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Ações */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
                <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
                <div className="flex gap-3">
                    <button type="button" onClick={() => handleCreate(true)} disabled={loading} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50">
                        {loading ? 'Salvando...' : 'Salvar Rascunho'}
                    </button>
                    <button type="button" onClick={() => handleCreate(false)} disabled={loading} className="px-4 py-2 text-sm bg-[#2D9E6B] text-white rounded-md hover:bg-green-600 disabled:opacity-50">
                        {loading ? 'Enviando...' : 'Enviar para Análise'}
                    </button>
                </div>
            </div>

            {/* Modal IA */}
            {showAIModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#F5F7F8]">
                            <h3 className="font-semibold text-[#1A3C4A] flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#2D9E6B]" /> Gerador de Planos IA
                            </h3>
                            <button onClick={() => setShowAIModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">Descreva o objetivo principal do projeto. A IA preencherá as seções principais automaticamente.</p>
                            <textarea autoFocus rows={3} className={inputCls} placeholder="Ex: Projeto de reforço escolar para crianças carentes no município de..." value={ideiaCentral} onChange={e => setIdeiaCentral(e.target.value)} />
                            {generating && (
                                <div className="flex flex-col items-center py-4 space-y-2 animate-pulse">
                                    <div className="w-8 h-8 border-4 border-[#2D9E6B] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[#2D9E6B] font-medium text-sm">Gerando estrutura do plano...</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                            <button onClick={() => setShowAIModal(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md bg-white">Cancelar</button>
                            <button onClick={handleAI} disabled={generating || !ideiaCentral.trim()} className="px-4 py-2 text-sm bg-[#1A3C4A] text-white rounded-md hover:bg-[#2E6B7A] flex items-center gap-2 disabled:opacity-50 shadow-sm">
                                <Sparkles className="w-4 h-4" /> {generating ? 'Gerando...' : 'Gerar Plano Completo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Refinar Campo */}
            {refiningField && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#F5F7F8]">
                            <h3 className="font-semibold text-[#1A3C4A] flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-[#2D9E6B]" /> Refinar: {refiningField.name}
                            </h3>
                            <button onClick={() => setRefiningField(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">A IA reescreverá este campo com linguagem mais profissional e adequada às normas do MROSC.</p>
                            <div className="p-3 bg-gray-50 rounded border border-gray-100 text-xs text-gray-500 italic max-h-32 overflow-y-auto">
                                &quot;{refiningField.value || '(vazio)'}&quot;
                            </div>
                            {isRefining && (
                                <div className="flex items-center gap-2 text-[#2D9E6B] text-xs mt-4">
                                    <div className="w-3 h-3 border-2 border-[#2D9E6B] border-t-transparent rounded-full animate-spin" />
                                    Reescrevendo...
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                            <button onClick={() => setRefiningField(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md bg-white">Cancelar</button>
                            <button onClick={handleRefineField} disabled={isRefining} className="px-4 py-2 text-sm bg-[#2D9E6B] text-white rounded-md hover:bg-green-600 flex items-center gap-2 disabled:opacity-50">
                                <Sparkles className="w-4 h-4" /> {isRefining ? 'Reescrevendo...' : 'Reescrever Campo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function NovoPlanoTrabalhoPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-[#2D9E6B] border-t-transparent rounded-full" />
            </div>
        }>
            <NovoPlanoForm />
        </Suspense>
    )
}
