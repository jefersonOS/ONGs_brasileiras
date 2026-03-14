'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BlocoCert } from '@/lib/pdf-service'
import { v4 as uuidv4 } from 'uuid'
import Link from 'next/link'
import {
    ArrowLeft, Eye, RotateCcw, Save,
    Type, ImageIcon, Minus, Square, Trash2,
    CheckCircle, Loader2, Upload
} from 'lucide-react'
import { CertPreview } from '@/components/internal/CertPreview'

const VARIAVEIS = [
    { token: '{{nome}}', label: '{{NOME_ALUNO}}' },
    { token: '{{curso}}', label: '{{NOME_CURSO}}' },
    { token: '{{carga_horaria}}', label: '{{CARGA_HORARIA}}' },
    { token: '{{data_emissao}}', label: '{{DATA_EMISSAO}}' },
    { token: '{{codigo}}', label: '{{CODIGO}}' },
    { token: '{{periodo}}', label: '{{PERIODO}}' },
    { token: '{{instituicao}}', label: '{{INSTITUICAO}}' },
]

const DEFAULT_BLOCOS: BlocoCert[] = [
    { id: '1', texto: '{{instituicao}}', x: 0, y: 62, tam: 16, negrito: true, italico: false, cor: '#1A3C4A', alinhamento: 'centro' },
    { id: '2', texto: 'CERTIFICADO', x: 0, y: 120, tam: 42, negrito: true, italico: false, cor: '#1A3C4A', alinhamento: 'centro' },
    { id: '3', texto: 'DE CONCLUSÃO DE CURSO', x: 0, y: 175, tam: 20, negrito: false, italico: false, cor: '#1A3C4A', alinhamento: 'centro' },
    { id: '4', texto: 'Certificamos que', x: 0, y: 235, tam: 16, negrito: false, italico: false, cor: '#555555', alinhamento: 'centro' },
    { id: '5', texto: '{{nome}}', x: 0, y: 278, tam: 34, negrito: true, italico: false, cor: '#2D9E6B', alinhamento: 'centro' },
    { id: '6', texto: 'concluiu com êxito o curso de {{curso}}, com carga horária de {{carga_horaria}} horas.', x: 0, y: 332, tam: 15, negrito: false, italico: false, cor: '#555555', alinhamento: 'centro' },
    { id: '7', texto: 'Diretor(a)', x: 160, y: 488, tam: 12, negrito: false, italico: false, cor: '#777777', alinhamento: 'centro' },
    { id: '8', texto: 'Instrutor(a)', x: 530, y: 488, tam: 12, negrito: false, italico: false, cor: '#777777', alinhamento: 'centro' },
    { id: '9', texto: '{{periodo}}, {{data_emissao}}', x: 0, y: 528, tam: 12, negrito: false, italico: false, cor: '#777777', alinhamento: 'centro' },
    { id: '10', texto: 'Código: {{codigo}}', x: 0, y: 556, tam: 10, negrito: false, italico: false, cor: '#aaaaaa', alinhamento: 'centro' },
]

export default function CertificadosEditorPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [tenant, setTenant] = useState<any>(null)
    const [blocos, setBlocos] = useState<BlocoCert[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [corPrimaria, setCorPrimaria] = useState('#1A3C4A')
    const [corSecundaria, setCorSecundaria] = useState('#2D9E6B')
    const [certData, setCertData] = useState<any>({
        titulo: '', nome_instituicao: '', texto_pre: '', texto_pos: '',
        site_validacao: '', nome_responsavel: '', cargo_responsavel: '',
        assinatura_url: '', fundo_url: '', logo_url: '',
        alinhamento: 'centro', mostrar_borda: true, mostrar_codigo: true,
        mostrar_carga_horaria: true, mostrar_instituicao: true,
        tam_titulo: 36, tam_nome: 32, tam_texto: 18, tam_instituicao: 16,
        cor_texto: '#4D4D4D', cor_nome: '', texto_complementar: '',
        pos_y_conteudo: 0, pos_y_rodape: 0, pos_x_conteudo: 0, pos_x_rodape: 0,
        nome_mediador: '', cargo_mediador: '', assinatura_mediador_url: '',
        off_x_mediador: 0, off_y_mediador: 0, off_x_responsavel: 0, off_y_responsavel: 0,
    })
    const [uploadingFundo, setUploadingFundo] = useState(false)
    const [copied, setCopied] = useState('')

    const fetchData = useCallback(async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }
        const tenantId = user.user_metadata?.tenant_id
        if (!tenantId) { setLoading(false); return }
        const { data } = await supabase.from('tenants').select('*').eq('id', tenantId).single()
        if (data) {
            setTenant(data)
            const cfg = data.config_portal || {}
            setBlocos(cfg.cert_blocos?.length > 0
                ? cfg.cert_blocos
                : DEFAULT_BLOCOS.map(b => ({ ...b, id: uuidv4() })))
            setCorPrimaria(cfg.cor_primaria || '#1A3C4A')
            setCorSecundaria(cfg.cor_secundaria || '#2D9E6B')
            setCertData({
                titulo: cfg.cert_titulo || '',
                nome_instituicao: cfg.cert_nome_instituicao || '',
                texto_pre: cfg.cert_texto_pre || '',
                texto_pos: cfg.cert_texto_pos || '',
                site_validacao: cfg.cert_site_validacao || '',
                nome_responsavel: cfg.cert_nome_responsavel || '',
                cargo_responsavel: cfg.cert_cargo_responsavel || '',
                assinatura_url: cfg.cert_assinatura_url || '',
                fundo_url: cfg.cert_fundo_url || '',
                logo_url: cfg.cert_logo_url || '',
                alinhamento: cfg.cert_alinhamento || 'centro',
                mostrar_borda: cfg.cert_mostrar_borda !== false,
                mostrar_codigo: cfg.cert_mostrar_codigo !== false,
                mostrar_carga_horaria: cfg.cert_mostrar_carga_horaria !== false,
                mostrar_instituicao: cfg.cert_mostrar_instituicao !== false,
                tam_titulo: cfg.cert_tam_titulo || 36,
                tam_nome: cfg.cert_tam_nome || 32,
                tam_texto: cfg.cert_tam_texto || 18,
                tam_instituicao: cfg.cert_tam_instituicao || 16,
                cor_texto: cfg.cert_cor_texto || '#4D4D4D',
                cor_nome: cfg.cert_cor_nome || '',
                texto_complementar: '',
                pos_y_conteudo: cfg.cert_pos_y_conteudo ?? 0,
                pos_y_rodape: cfg.cert_pos_y_rodape ?? 0,
                pos_x_conteudo: cfg.cert_pos_x_conteudo ?? 0,
                pos_x_rodape: cfg.cert_pos_x_rodape ?? 0,
                nome_mediador: cfg.cert_nome_mediador || '',
                cargo_mediador: cfg.cert_cargo_mediador || '',
                assinatura_mediador_url: cfg.cert_assinatura_mediador_url || '',
                off_x_mediador: cfg.cert_off_x_mediador ?? 0,
                off_y_mediador: cfg.cert_off_y_mediador ?? 0,
                off_x_responsavel: cfg.cert_off_x_responsavel ?? 0,
                off_y_responsavel: cfg.cert_off_y_responsavel ?? 0,
            })
        }
        setLoading(false)
    }, [supabase])

    useEffect(() => { fetchData() }, [fetchData])

    const handleSave = async () => {
        if (!tenant) return
        setSaving(true)
        const newConfig = {
            ...tenant.config_portal,
            cert_blocos: blocos,
            cert_fundo_url: certData.fundo_url || null,
        }
        await supabase.from('tenants').update({ config_portal: newConfig }).eq('id', tenant.id)
        setTenant((t: any) => ({ ...t, config_portal: newConfig }))
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
    }

    const handleReset = () => {
        if (!confirm('Restaurar o layout padrão? Os elementos atuais serão substituídos.')) return
        setBlocos(DEFAULT_BLOCOS.map(b => ({ ...b, id: uuidv4() })))
        setSelectedId(null)
    }

    const addTexto = () => {
        const novo: BlocoCert = {
            id: uuidv4(), texto: 'Novo texto',
            x: 0, y: 200, tam: 18,
            negrito: false, italico: false,
            cor: '#4D4D4D', alinhamento: 'centro',
        }
        setBlocos(prev => [...prev, novo])
        setSelectedId(novo.id)
    }

    const removeBloco = (id: string) => {
        setBlocos(prev => prev.filter(b => b.id !== id))
        if (selectedId === id) setSelectedId(null)
    }

    const updateBloco = (id: string, patch: Partial<BlocoCert>) => {
        setBlocos(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
    }

    const copyToken = (token: string) => {
        navigator.clipboard.writeText(token)
        setCopied(token)
        setTimeout(() => setCopied(''), 1500)
    }

    const selectedBloco = blocos.find(b => b.id === selectedId)

    if (loading) return (
        <div className="h-screen flex items-center justify-center text-gray-400 font-black uppercase text-xs tracking-widest animate-pulse">
            Carregando editor...
        </div>
    )

    return (
        <div className="h-screen flex flex-col bg-[#f8f9fa] overflow-hidden">
            {/* Top Bar */}
            <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <Link href="/configuracoes"
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-[#1A3C4A]">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-black text-[#1A3C4A] leading-tight">Editor de Certificados</h1>
                        <p className="text-[10px] text-gray-400 font-medium leading-tight">Personalize o layout dos certificados da sua instituição</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.open(`/configuracoes`, '_blank')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all">
                        <Eye className="w-3.5 h-3.5" /> Visualizar
                    </button>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all">
                        <RotateCcw className="w-3.5 h-3.5" /> Resetar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-5 py-2 bg-[#2D9E6B] text-white rounded-xl text-xs font-black hover:bg-[#2D9E6B]/90 transition-all disabled:opacity-70 shadow-lg shadow-green-900/20">
                        {saving
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : saved
                            ? <CheckCircle className="w-3.5 h-3.5" />
                            : <Save className="w-3.5 h-3.5" />}
                        {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Template'}
                    </button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-60 bg-white border-r border-gray-100 flex flex-col overflow-y-auto shrink-0">
                    <div className="p-4 space-y-5">

                        {/* FUNDO */}
                        <section>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Fundo</p>
                            <p className="text-[11px] font-bold text-gray-600 mb-2">Imagem de Fundo</p>
                            <label className={`flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all text-xs font-bold text-gray-600 ${uploadingFundo ? 'opacity-50 pointer-events-none' : ''}`}>
                                <Upload className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">
                                    {uploadingFundo ? 'Enviando...' : certData.fundo_url ? 'Trocar arquivo' : 'Escolher arquivo'}
                                </span>
                                <span className="text-gray-400 text-[10px] truncate max-w-[60px]">
                                    {certData.fundo_url ? 'Selecionado' : 'Nen... lhido'}
                                </span>
                                <input type="file" accept="image/png,image/jpeg" className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0]
                                        if (!file) return
                                        setUploadingFundo(true)
                                        const fd = new FormData()
                                        fd.append('file', file)
                                        const res = await fetch('/api/configuracoes/certificados/upload-fundo', { method: 'POST', body: fd })
                                        const data = await res.json()
                                        if (data.url) setCertData((prev: any) => ({ ...prev, fundo_url: data.url }))
                                        setUploadingFundo(false)
                                        e.target.value = ''
                                    }} />
                            </label>
                            {certData.fundo_url && (
                                <button
                                    onClick={() => setCertData((prev: any) => ({ ...prev, fundo_url: '' }))}
                                    className="text-[10px] text-red-400 font-bold hover:text-red-600 transition-colors mt-1">
                                    Remover fundo
                                </button>
                            )}
                        </section>

                        {/* ADICIONAR */}
                        <section>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Adicionar</p>
                            <div className="grid grid-cols-2 gap-1.5">
                                <button onClick={addTexto}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-[#1A3C4A] hover:text-white hover:border-[#1A3C4A] transition-all">
                                    <Type className="w-3.5 h-3.5" /> Texto
                                </button>
                                <button disabled className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-300 cursor-not-allowed">
                                    <ImageIcon className="w-3.5 h-3.5" /> Imagem
                                </button>
                                <button disabled className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-300 cursor-not-allowed">
                                    <Minus className="w-3.5 h-3.5" /> Linha
                                </button>
                                <button disabled className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-300 cursor-not-allowed">
                                    <Square className="w-3.5 h-3.5" /> Retângulo
                                </button>
                            </div>
                        </section>

                        {/* VARIÁVEIS */}
                        <section>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Variáveis</p>
                            <div className="space-y-1">
                                {VARIAVEIS.map(v => (
                                    <button key={v.token} onClick={() => copyToken(v.token)}
                                        title="Clique para copiar"
                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-colors ${copied === v.token ? 'bg-green-50 text-[#2D9E6B]' : 'bg-[#1A3C4A]/5 hover:bg-[#1A3C4A]/10 text-[#1A3C4A]'}`}>
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[9px] text-gray-400 mt-1.5">Clique para copiar e cole no texto</p>
                        </section>

                        {/* ELEMENTOS */}
                        <section>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Elementos ({blocos.length})</p>
                            <div className="space-y-0.5">
                                {blocos.map(bloco => (
                                    <div key={bloco.id}
                                        onClick={() => setSelectedId(bloco.id === selectedId ? null : bloco.id)}
                                        className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all group ${selectedId === bloco.id ? 'bg-[#1A3C4A] text-white' : 'hover:bg-gray-50 text-gray-700'}`}>
                                        <span className={`text-[11px] font-medium truncate max-w-[140px] ${selectedId === bloco.id ? 'text-white' : 'text-gray-700'}`}>
                                            {bloco.texto || '(vazio)'}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); removeBloco(bloco.id) }}
                                            className={`p-1 rounded-lg transition-colors shrink-0 ${selectedId === bloco.id ? 'hover:bg-white/20 text-white/60 hover:text-white' : 'opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500'}`}>
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-auto flex flex-col items-center py-8 px-6 gap-6">
                    {/* Certificate */}
                    <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/15 border border-gray-200">
                        <CertPreview
                            certData={certData}
                            blocos={blocos}
                            corPrimaria={corPrimaria}
                            corSecundaria={corSecundaria}
                            tenantNome={tenant?.nome || ''}
                            scale={0.85}
                            hideLabels
                        />
                    </div>

                    {/* Inline editor for selected block */}
                    {selectedBloco && (
                        <div className="w-full max-w-[716px] bg-white rounded-2xl border border-gray-200 shadow-lg p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-200">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A3C4A]">
                                    Editando: <span className="text-[#2D9E6B]">{selectedBloco.texto.slice(0, 30)}{selectedBloco.texto.length > 30 ? '…' : ''}</span>
                                </p>
                                <button onClick={() => setSelectedId(null)}
                                    className="text-gray-400 hover:text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors">
                                    Fechar
                                </button>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Texto</label>
                                <textarea rows={2} value={selectedBloco.texto}
                                    onChange={e => updateBloco(selectedBloco.id, { texto: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium resize-none font-mono focus:ring-2 focus:ring-[#2D9E6B]/20" />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Y (topo→base)</label>
                                    <input type="number" min={0} max={595} value={selectedBloco.y}
                                        onChange={e => updateBloco(selectedBloco.id, { y: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">X (esq→dir)</label>
                                    <input type="number" min={0} max={841} value={selectedBloco.x}
                                        onChange={e => updateBloco(selectedBloco.id, { x: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tamanho (pt)</label>
                                    <input type="number" min={8} max={72} value={selectedBloco.tam}
                                        onChange={e => updateBloco(selectedBloco.id, { tam: Number(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold" />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 flex-wrap">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={selectedBloco.negrito}
                                        onChange={e => updateBloco(selectedBloco.id, { negrito: e.target.checked })}
                                        className="w-4 h-4 accent-[#2D9E6B]" />
                                    <span className="text-[11px] font-black text-gray-600">Negrito</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={selectedBloco.italico}
                                        onChange={e => updateBloco(selectedBloco.id, { italico: e.target.checked })}
                                        className="w-4 h-4 accent-[#2D9E6B]" />
                                    <span className="text-[11px] font-black text-gray-600">Itálico</span>
                                </label>
                                <div className="flex items-center gap-2">
                                    <label className="text-[11px] font-black text-gray-600">Cor</label>
                                    <input type="color" value={selectedBloco.cor}
                                        onChange={e => updateBloco(selectedBloco.id, { cor: e.target.value })}
                                        className="w-8 h-8 rounded-lg border-none p-0.5 cursor-pointer bg-gray-50" />
                                    <input type="text" value={selectedBloco.cor}
                                        onChange={e => updateBloco(selectedBloco.id, { cor: e.target.value })}
                                        className="w-20 px-2 py-1.5 bg-gray-50 rounded-lg text-[11px] font-mono border-none" />
                                </div>
                                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                                    {(['esquerda', 'centro', 'direita'] as const).map(a => (
                                        <button key={a} type="button"
                                            onClick={() => updateBloco(selectedBloco.id, { alinhamento: a })}
                                            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${selectedBloco.alinhamento === a ? 'bg-white shadow text-[#1A3C4A]' : 'text-gray-400'}`}>
                                            {a === 'esquerda' ? '←' : a === 'centro' ? '↔' : '→'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
