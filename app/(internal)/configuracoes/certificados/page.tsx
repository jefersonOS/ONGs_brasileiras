'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BlocoCert, FONTES_CERT, FonteCert } from '@/lib/pdf-service'
import { v4 as uuidv4 } from 'uuid'
import Link from 'next/link'
import {
    ArrowLeft, RotateCcw, Save,
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
    { token: '{{tipo_turma}}', label: '{{TIPO_TURMA}}' },
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

const inputCls = 'w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#2D9E6B]/20 transition-all'
const UPLOAD_API = '/api/configuracoes/certificados/upload-fundo'

async function uploadFile(file: File, type = 'fundo'): Promise<string | null> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`${UPLOAD_API}?type=${type}`, { method: 'POST', body: fd })
    const data = await res.json()
    return data.url || null
}

export default function CertificadosEditorPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [tenant, setTenant] = useState<any>(null)

    // Blocos
    const [blocos, setBlocos] = useState<BlocoCert[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [copied, setCopied] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Visual
    const [corPrimaria, setCorPrimaria] = useState('#1A3C4A')
    const [corSecundaria, setCorSecundaria] = useState('#2D9E6B')

    // Upload states
    const [uploadingFundo, setUploadingFundo] = useState(false)
    const [uploadingLogo, setUploadingLogo] = useState(false)
    const [uploadingAssinatura, setUploadingAssinatura] = useState(false)
    const [uploadingMediador, setUploadingMediador] = useState(false)

    // Cert config (all fields)
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
            cert_titulo: certData.titulo,
            cert_nome_instituicao: certData.nome_instituicao,
            cert_texto_pre: certData.texto_pre,
            cert_texto_pos: certData.texto_pos,
            cert_site_validacao: certData.site_validacao,
            cert_nome_responsavel: certData.nome_responsavel,
            cert_cargo_responsavel: certData.cargo_responsavel,
            cert_assinatura_url: certData.assinatura_url,
            cert_fundo_url: certData.fundo_url || null,
            cert_logo_url: certData.logo_url || null,
            cert_alinhamento: certData.alinhamento,
            cert_mostrar_borda: certData.mostrar_borda,
            cert_mostrar_codigo: certData.mostrar_codigo,
            cert_mostrar_carga_horaria: certData.mostrar_carga_horaria,
            cert_mostrar_instituicao: certData.mostrar_instituicao,
            cert_tam_titulo: certData.tam_titulo,
            cert_tam_nome: certData.tam_nome,
            cert_tam_texto: certData.tam_texto,
            cert_tam_instituicao: certData.tam_instituicao,
            cert_cor_texto: certData.cor_texto,
            cert_cor_nome: certData.cor_nome,
            cert_pos_y_conteudo: certData.pos_y_conteudo,
            cert_pos_y_rodape: certData.pos_y_rodape,
            cert_pos_x_conteudo: certData.pos_x_conteudo,
            cert_pos_x_rodape: certData.pos_x_rodape,
            cert_nome_mediador: certData.nome_mediador,
            cert_cargo_mediador: certData.cargo_mediador,
            cert_assinatura_mediador_url: certData.assinatura_mediador_url,
            cert_off_x_mediador: certData.off_x_mediador,
            cert_off_y_mediador: certData.off_y_mediador,
            cert_off_x_responsavel: certData.off_x_responsavel,
            cert_off_y_responsavel: certData.off_y_responsavel,
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
        const ta = textareaRef.current
        if (selectedId && ta) {
            const start = ta.selectionStart
            const end = ta.selectionEnd
            const current = ta.value
            const next = current.slice(0, start) + token + current.slice(end)
            updateBloco(selectedId, { texto: next })
            // Restore cursor after React re-render
            requestAnimationFrame(() => {
                ta.focus()
                ta.setSelectionRange(start + token.length, start + token.length)
            })
        } else {
            navigator.clipboard.writeText(token)
            setCopied(token)
            setTimeout(() => setCopied(''), 1500)
        }
    }

    const set = (field: string, value: any) => setCertData((prev: any) => ({ ...prev, [field]: value }))

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
                    <Link href="/configuracoes" className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 hover:text-[#1A3C4A]">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-sm font-black text-[#1A3C4A] leading-tight">Editor de Certificados</h1>
                        <p className="text-[10px] text-gray-400 font-medium leading-tight">Personalize o layout dos certificados da sua instituição</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleReset} className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all">
                        <RotateCcw className="w-3.5 h-3.5" /> Resetar
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-5 py-2 bg-[#2D9E6B] text-white rounded-xl text-xs font-black hover:bg-[#2D9E6B]/90 transition-all disabled:opacity-70 shadow-lg shadow-green-900/20">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Template'}
                    </button>
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="w-64 bg-white border-r border-gray-100 flex flex-col shrink-0">
                    <div className="flex-1 overflow-y-auto p-4 space-y-5">
                            {/* FUNDO */}
                            <section>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Fundo</p>
                                <div className="space-y-1">
                                    <p className="text-[11px] font-bold text-gray-600">Imagem de Fundo</p>
                                    <label className={`flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all text-xs font-bold text-gray-600 ${uploadingFundo ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <Upload className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{uploadingFundo ? 'Enviando...' : certData.fundo_url ? 'Trocar fundo' : 'Escolher arquivo'}</span>
                                        <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={async (e) => {
                                            const file = e.target.files?.[0]; if (!file) return
                                            setUploadingFundo(true)
                                            const url = await uploadFile(file)
                                            if (url) set('fundo_url', url)
                                            setUploadingFundo(false); e.target.value = ''
                                        }} />
                                    </label>
                                    {certData.fundo_url && <button onClick={() => set('fundo_url', '')} className="text-[10px] text-red-400 font-bold hover:text-red-600 transition-colors">Remover fundo</button>}
                                </div>
                            </section>

                            {/* ADICIONAR */}
                            <section>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Adicionar</p>
                                <div className="grid grid-cols-2 gap-1.5">
                                    <button onClick={addTexto} className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-[#1A3C4A] hover:text-white hover:border-[#1A3C4A] transition-all">
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

                            {/* ELEMENTOS + VARIÁVEIS */}
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
                                            <button onClick={(e) => { e.stopPropagation(); removeBloco(bloco.id) }}
                                                className={`p-1 rounded-lg transition-colors shrink-0 ${selectedId === bloco.id ? 'hover:bg-white/20 text-white/60 hover:text-white' : 'opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500'}`}>
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        {/* TEXTOS */}
                            <section>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Textos</p>
                                <div className="space-y-2">
                                    <input value={certData.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Título (ex: CERTIFICADO DE CONCLUSÃO)" className={inputCls} />
                                    <input value={certData.nome_instituicao} onChange={e => set('nome_instituicao', e.target.value)} placeholder="Nome da instituição" className={inputCls} />
                                    <input value={certData.texto_pre} onChange={e => set('texto_pre', e.target.value)} placeholder="Texto pré (ex: Certificamos que)" className={inputCls} />
                                    <input value={certData.texto_pos} onChange={e => set('texto_pos', e.target.value)} placeholder="Texto pós (ex: concluiu com êxito...)" className={inputCls} />
                                    <input value={certData.site_validacao} onChange={e => set('site_validacao', e.target.value)} placeholder="Site de validação" className={inputCls} />
                                </div>
                            </section>

                            {/* TIPOGRAFIA */}
                            <section>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Tipografia</p>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Título', key: 'tam_titulo', min: 20, max: 60 },
                                        { label: 'Nome', key: 'tam_nome', min: 16, max: 56 },
                                        { label: 'Corpo', key: 'tam_texto', min: 10, max: 30 },
                                        { label: 'Instituição', key: 'tam_instituicao', min: 8, max: 28 },
                                    ].map(({ label, key, min, max }) => (
                                        <div key={key}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[10px] font-bold text-gray-500">{label}</span>
                                                <span className="text-[10px] font-black text-[#2D9E6B]">{certData[key]}pt</span>
                                            </div>
                                            <input type="range" min={min} max={max} value={certData[key]}
                                                onChange={e => set(key, Number(e.target.value))}
                                                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#2D9E6B]" />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* CORES */}
                            <section>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Cores</p>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Cor do Texto', key: 'cor_texto' },
                                        { label: 'Cor do Nome', key: 'cor_nome' },
                                    ].map(({ label, key }) => (
                                        <div key={key} className="flex items-center gap-2">
                                            <input type="color" value={certData[key] || '#4D4D4D'}
                                                onChange={e => set(key, e.target.value)}
                                                className="w-8 h-8 rounded-lg border-none p-0.5 cursor-pointer bg-gray-50 shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                                                <input type="text" value={certData[key] || ''}
                                                    onChange={e => set(key, e.target.value)}
                                                    placeholder="#4D4D4D"
                                                    className="w-full px-2 py-1 bg-gray-50 rounded-lg text-[10px] font-mono border-none mt-0.5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* VISIBILIDADE */}
                            <section>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Visibilidade</p>
                                <div className="space-y-1.5">
                                    {[
                                        { key: 'mostrar_borda', label: 'Borda decorativa' },
                                        { key: 'mostrar_instituicao', label: 'Nome Instituição' },
                                        { key: 'mostrar_carga_horaria', label: 'Carga Horária' },
                                        { key: 'mostrar_codigo', label: 'Código QR/Valid.' },
                                    ].map(({ key, label }) => (
                                        <label key={key} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                                            <span className="text-[11px] font-bold text-gray-600">{label}</span>
                                            <div className="relative">
                                                <input type="checkbox" checked={certData[key]} onChange={e => set(key, e.target.checked)} className="sr-only peer" />
                                                <div className="w-8 h-4 bg-gray-200 rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#2D9E6B]"></div>
                                            </div>
                                        </label>
                                    ))}
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 mt-2">Alinhamento</p>
                                        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                                            {(['esquerda', 'centro', 'direita'] as const).map(a => (
                                                <button key={a} type="button" onClick={() => set('alinhamento', a)}
                                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all ${certData.alinhamento === a ? 'bg-white shadow text-[#1A3C4A]' : 'text-gray-400'}`}>
                                                    {a === 'esquerda' ? '←' : a === 'centro' ? '↔' : '→'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* POSIÇÃO */}
                            <section>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Posição do Conteúdo</p>
                                <div className="space-y-2">
                                    {[
                                        { label: 'Conteúdo Vertical', key: 'pos_y_conteudo' },
                                        { label: 'Conteúdo Horizontal', key: 'pos_x_conteudo' },
                                        { label: 'Rodapé Vertical', key: 'pos_y_rodape' },
                                        { label: 'Rodapé Horizontal', key: 'pos_x_rodape' },
                                    ].map(({ label, key }) => (
                                        <div key={key}>
                                            <div className="flex justify-between mb-0.5">
                                                <span className="text-[10px] font-bold text-gray-500">{label}</span>
                                                <span className="text-[10px] font-black text-[#2D9E6B]">{certData[key] > 0 ? '+' : ''}{certData[key]}</span>
                                            </div>
                                            <input type="range" min={-300} max={300} value={certData[key]}
                                                onChange={e => set(key, Number(e.target.value))}
                                                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#2D9E6B]" />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* ASSINATURAS */}
                            <section>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Assinatura — Responsável</p>
                                <div className="space-y-2">
                                    <input value={certData.nome_responsavel} onChange={e => set('nome_responsavel', e.target.value)} placeholder="Nome do responsável" className={inputCls} />
                                    <input value={certData.cargo_responsavel} onChange={e => set('cargo_responsavel', e.target.value)} placeholder="Cargo" className={inputCls} />
                                    <label className={`flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all text-xs font-bold text-gray-600 ${uploadingAssinatura ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <Upload className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{uploadingAssinatura ? 'Enviando...' : certData.assinatura_url ? 'Trocar assinatura' : 'Upload assinatura (PNG)'}</span>
                                        <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={async (e) => {
                                            const file = e.target.files?.[0]; if (!file) return
                                            setUploadingAssinatura(true)
                                            const url = await uploadFile(file, 'assinatura')
                                            if (url) set('assinatura_url', url)
                                            setUploadingAssinatura(false); e.target.value = ''
                                        }} />
                                    </label>
                                    {certData.assinatura_url && (
                                        <div className="flex items-center gap-2">
                                            <img src={certData.assinatura_url} alt="Assinatura" className="h-10 object-contain bg-gray-50 rounded-lg p-1" />
                                            <button onClick={() => set('assinatura_url', '')} className="text-[10px] text-red-400 font-bold hover:text-red-600">Remover</button>
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex justify-between mb-0.5">
                                            <span className="text-[10px] font-bold text-gray-500">Ajuste Horizontal</span>
                                            <span className="text-[10px] font-black text-[#2D9E6B]">{certData.off_x_responsavel > 0 ? '+' : ''}{certData.off_x_responsavel}</span>
                                        </div>
                                        <input type="range" min={-300} max={300} value={certData.off_x_responsavel}
                                            onChange={e => set('off_x_responsavel', Number(e.target.value))}
                                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#2D9E6B]" />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Assinatura — Mediador (opcional)</p>
                                <div className="space-y-2">
                                    <input value={certData.nome_mediador} onChange={e => set('nome_mediador', e.target.value)} placeholder="Nome do mediador" className={inputCls} />
                                    <input value={certData.cargo_mediador} onChange={e => set('cargo_mediador', e.target.value)} placeholder="Cargo" className={inputCls} />
                                    <label className={`flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all text-xs font-bold text-gray-600 ${uploadingMediador ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <Upload className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{uploadingMediador ? 'Enviando...' : certData.assinatura_mediador_url ? 'Trocar assinatura' : 'Upload assinatura (PNG)'}</span>
                                        <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={async (e) => {
                                            const file = e.target.files?.[0]; if (!file) return
                                            setUploadingMediador(true)
                                            const url = await uploadFile(file, 'assinatura_mediador')
                                            if (url) set('assinatura_mediador_url', url)
                                            setUploadingMediador(false); e.target.value = ''
                                        }} />
                                    </label>
                                    {certData.assinatura_mediador_url && (
                                        <div className="flex items-center gap-2">
                                            <img src={certData.assinatura_mediador_url} alt="Assinatura mediador" className="h-10 object-contain bg-gray-50 rounded-lg p-1" />
                                            <button onClick={() => set('assinatura_mediador_url', '')} className="text-[10px] text-red-400 font-bold hover:text-red-600">Remover</button>
                                        </div>
                                    )}
                                    <div>
                                        <div className="flex justify-between mb-0.5">
                                            <span className="text-[10px] font-bold text-gray-500">Ajuste Horizontal</span>
                                            <span className="text-[10px] font-black text-[#2D9E6B]">{certData.off_x_mediador > 0 ? '+' : ''}{certData.off_x_mediador}</span>
                                        </div>
                                        <input type="range" min={-300} max={300} value={certData.off_x_mediador}
                                            onChange={e => set('off_x_mediador', Number(e.target.value))}
                                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#2D9E6B]" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-0.5">
                                            <span className="text-[10px] font-bold text-gray-500">Ajuste Vertical (ambos)</span>
                                            <span className="text-[10px] font-black text-[#2D9E6B]">{certData.off_y_responsavel > 0 ? '+' : ''}{certData.off_y_responsavel}</span>
                                        </div>
                                        <input type="range" min={-300} max={300} value={certData.off_y_responsavel}
                                            onChange={e => set('off_y_responsavel', Number(e.target.value))}
                                            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#2D9E6B]" />
                                    </div>
                                </div>
                            </section>

                            {/* LOGO */}
                            <section>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-2">Logo do Certificado</p>
                                <label className={`flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all text-xs font-bold text-gray-600 ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <Upload className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{uploadingLogo ? 'Enviando...' : certData.logo_url ? 'Trocar logo' : 'Upload logo (PNG)'}</span>
                                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={async (e) => {
                                        const file = e.target.files?.[0]; if (!file) return
                                        setUploadingLogo(true)
                                        const url = await uploadFile(file, 'logo')
                                        if (url) set('logo_url', url)
                                        setUploadingLogo(false); e.target.value = ''
                                    }} />
                                </label>
                                {certData.logo_url && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <img src={certData.logo_url} alt="Logo" className="h-10 object-contain bg-gray-50 rounded-lg p-1" />
                                        <button onClick={() => set('logo_url', '')} className="text-[10px] text-red-400 font-bold hover:text-red-600">Remover</button>
                                    </div>
                                )}
                            </section>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-auto flex flex-col items-center py-8 px-6 gap-6">
                    <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/15 border border-gray-200">
                        <CertPreview
                            certData={certData}
                            blocos={blocos}
                            corPrimaria={corPrimaria}
                            corSecundaria={corSecundaria}
                            tenantNome={tenant?.nome || ''}
                            scale={0.85}
                            hideLabels
                            editable
                            selectedId={selectedId ?? undefined}
                            onSelectBloco={setSelectedId}
                            onUpdateBloco={updateBloco}
                        />
                    </div>

                    {/* Inline element editor */}
                    {selectedBloco && (
                        <div className="w-full max-w-[716px] bg-white rounded-2xl border border-gray-200 shadow-lg p-5 space-y-4 animate-in slide-in-from-bottom-4 duration-200">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#1A3C4A]">
                                    Editando: <span className="text-[#2D9E6B]">{selectedBloco.texto.slice(0, 30)}{selectedBloco.texto.length > 30 ? '…' : ''}</span>
                                </p>
                                <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-600 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 px-2 py-1 rounded-lg transition-colors">
                                    Fechar
                                </button>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Texto</label>
                                <textarea ref={textareaRef} rows={2} value={selectedBloco.texto}
                                    onChange={e => updateBloco(selectedBloco.id, { texto: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium resize-none font-mono focus:ring-2 focus:ring-[#2D9E6B]/20" />
                                <div className="flex flex-wrap gap-1 pt-1">
                                    {VARIAVEIS.map(v => (
                                        <button key={v.token} onClick={() => copyToken(v.token)} type="button"
                                            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#1A3C4A]/5 hover:bg-[#1A3C4A]/15 text-[#1A3C4A] transition-colors">
                                            {v.token}
                                        </button>
                                    ))}
                                </div>
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
                                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                                    <button type="button"
                                        onClick={() => updateBloco(selectedBloco.id, { maiuscula: true })}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all tracking-widest ${selectedBloco.maiuscula !== false && selectedBloco.maiuscula !== null ? 'bg-white shadow text-[#1A3C4A]' : 'text-gray-400'}`}>
                                        AA
                                    </button>
                                    <button type="button"
                                        onClick={() => updateBloco(selectedBloco.id, { maiuscula: false })}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${selectedBloco.maiuscula === false ? 'bg-white shadow text-[#1A3C4A]' : 'text-gray-400'}`}>
                                        Aa
                                    </button>
                                    <button type="button"
                                        onClick={() => updateBloco(selectedBloco.id, { maiuscula: null })}
                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition-all ${selectedBloco.maiuscula === null ? 'bg-white shadow text-[#1A3C4A]' : 'text-gray-400'}`}
                                        title="Como digitado — edite o texto manualmente com a capitalização desejada">
                                        ab
                                    </button>
                                </div>
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
                                <div className="flex items-center gap-2">
                                    <label className="text-[11px] font-black text-gray-600 shrink-0">Fonte</label>
                                    <select
                                        value={selectedBloco.fonte || 'helvetica'}
                                        onChange={e => updateBloco(selectedBloco.id, { fonte: e.target.value as FonteCert })}
                                        className="flex-1 px-2 py-1.5 bg-gray-50 rounded-lg text-[11px] font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2D9E6B]/20"
                                    >
                                        {FONTES_CERT.map(f => (
                                            <option key={f.value} value={f.value}>{f.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
