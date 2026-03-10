'use client'

import { BlocoCert } from '@/lib/pdf-service'
import { Trash2, Plus, RotateCcw } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

const TOKENS = [
    { token: '{{nome}}', desc: 'Nome do participante (maiúsculas)' },
    { token: '{{curso}}', desc: 'Nome do curso / atividade' },
    { token: '{{carga_horaria}}', desc: 'Carga horária (ex: 40)' },
    { token: '{{periodo}}', desc: 'Período (ex: 01/03 a 30/04/2025)' },
    { token: '{{data_emissao}}', desc: 'Data de emissão' },
    { token: '{{instituicao}}', desc: 'Nome da instituição' },
    { token: '{{codigo}}', desc: 'Código de validação' },
]

export const DEFAULT_BLOCOS: BlocoCert[] = [
    { id: '1', texto: '{{instituicao}}', x: 0, y: 62, tam: 16, negrito: true, italico: false, cor: '#1A3C4A', alinhamento: 'centro' },
    { id: '2', texto: 'CERTIFICADO DE CONCLUSÃO', x: 0, y: 130, tam: 36, negrito: true, italico: false, cor: '#1A3C4A', alinhamento: 'centro' },
    { id: '3', texto: 'Certificamos que', x: 0, y: 200, tam: 18, negrito: false, italico: false, cor: '#4D4D4D', alinhamento: 'centro' },
    { id: '4', texto: '{{nome}}', x: 0, y: 248, tam: 32, negrito: true, italico: false, cor: '#2D9E6B', alinhamento: 'centro' },
    { id: '5', texto: 'concluiu com êxito o curso de', x: 0, y: 302, tam: 18, negrito: false, italico: false, cor: '#4D4D4D', alinhamento: 'centro' },
    { id: '6', texto: '"{{curso}}"', x: 0, y: 340, tam: 24, negrito: true, italico: false, cor: '#1A3C4A', alinhamento: 'centro' },
    { id: '7', texto: 'com carga horária total de {{carga_horaria}} horas.', x: 0, y: 385, tam: 16, negrito: false, italico: false, cor: '#4D4D4D', alinhamento: 'centro' },
]

interface Props {
    blocos: BlocoCert[]
    onChange: (blocos: BlocoCert[]) => void
}

export function CertBlocosEditor({ blocos, onChange }: Props) {
    const inputCls = 'px-3 py-2 bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#2D9E6B]/20 transition-all w-full'

    const addBloco = () => {
        onChange([...blocos, {
            id: uuidv4(),
            texto: 'Novo texto',
            x: 0, y: 200, tam: 18,
            negrito: false, italico: false,
            cor: '#4D4D4D', alinhamento: 'centro',
        }])
    }

    const updateBloco = (id: string, patch: Partial<BlocoCert>) => {
        onChange(blocos.map(b => b.id === id ? { ...b, ...patch } : b))
    }

    const removeBloco = (id: string) => {
        onChange(blocos.filter(b => b.id !== id))
    }

    const restoreDefault = () => {
        if (!confirm('Restaurar os blocos padrão? Os blocos atuais serão substituídos.')) return
        onChange(DEFAULT_BLOCOS.map(b => ({ ...b, id: uuidv4() })))
    }

    return (
        <div className="space-y-5">
            {/* Tokens disponíveis */}
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Tokens disponíveis — clique para copiar</p>
                <div className="flex flex-wrap gap-2">
                    {TOKENS.map(t => (
                        <button
                            key={t.token}
                            type="button"
                            title={t.desc}
                            onClick={() => { navigator.clipboard.writeText(t.token) }}
                            className="px-3 py-1.5 bg-white rounded-xl border border-gray-200 text-[11px] font-black text-[#1A3C4A] hover:border-[#2D9E6B] hover:text-[#2D9E6B] transition-all font-mono"
                        >
                            {t.token}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Use quebras de linha (Enter) no texto para criar múltiplas linhas. Exemplo: <span className="font-mono text-[#1A3C4A]">Linha 1\nLinha 2</span></p>
            </div>

            {/* Lista de blocos */}
            <div className="space-y-4">
                {blocos.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        <p className="font-bold">Nenhum bloco configurado.</p>
                        <p className="text-xs mt-1">Adicione blocos abaixo ou restaure o layout padrão.</p>
                    </div>
                )}

                {blocos.map((bloco, idx) => (
                    <div key={bloco.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bloco {idx + 1}</span>
                            <button type="button" onClick={() => removeBloco(bloco.id)}
                                className="flex items-center gap-1.5 text-[10px] font-black text-red-400 hover:text-red-600 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                                Remover
                            </button>
                        </div>

                        {/* Textarea do texto */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Texto (suporta tokens e quebras de linha)</label>
                            <textarea
                                rows={2}
                                value={bloco.texto}
                                onChange={e => updateBloco(bloco.id, { texto: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#2D9E6B]/20 transition-all resize-none font-mono"
                                placeholder="Ex: Certificamos que {{nome}}"
                            />
                        </div>

                        {/* Posição e tamanho */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">X (esq→dir)</label>
                                <input type="number" min={0} max={841} value={bloco.x}
                                    onChange={e => updateBloco(bloco.id, { x: Number(e.target.value) })}
                                    className={inputCls} />
                                <p className="text-[9px] text-gray-400">Ignorado se centrado</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Y (cima→baixo)</label>
                                <input type="number" min={0} max={595} value={bloco.y}
                                    onChange={e => updateBloco(bloco.id, { y: Number(e.target.value) })}
                                    className={inputCls} />
                                <p className="text-[9px] text-gray-400">0 = topo, 595 = base</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tamanho</label>
                                <input type="number" min={8} max={72} value={bloco.tam}
                                    onChange={e => updateBloco(bloco.id, { tam: Number(e.target.value) })}
                                    className={inputCls} />
                                <p className="text-[9px] text-gray-400">8–72 pt</p>
                            </div>
                        </div>

                        {/* Estilo e alinhamento */}
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Negrito */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={bloco.negrito}
                                    onChange={e => updateBloco(bloco.id, { negrito: e.target.checked })}
                                    className="w-4 h-4 accent-[#2D9E6B]" />
                                <span className="text-[11px] font-black text-gray-500">Negrito</span>
                            </label>

                            {/* Itálico */}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={bloco.italico}
                                    onChange={e => updateBloco(bloco.id, { italico: e.target.checked })}
                                    className="w-4 h-4 accent-[#2D9E6B]" />
                                <span className="text-[11px] font-black text-gray-500">Itálico</span>
                            </label>

                            {/* Cor */}
                            <div className="flex items-center gap-2">
                                <label className="text-[11px] font-black text-gray-500">Cor</label>
                                <input type="color" value={bloco.cor}
                                    onChange={e => updateBloco(bloco.id, { cor: e.target.value })}
                                    className="w-8 h-8 rounded-lg border-none p-0.5 cursor-pointer bg-gray-50" />
                                <input type="text" value={bloco.cor}
                                    onChange={e => updateBloco(bloco.id, { cor: e.target.value })}
                                    className="px-2 py-1.5 bg-gray-50 rounded-lg text-[11px] font-mono w-20 border-none" />
                            </div>

                            {/* Alinhamento */}
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                                {(['esquerda', 'centro', 'direita'] as const).map(a => (
                                    <button key={a} type="button"
                                        onClick={() => updateBloco(bloco.id, { alinhamento: a })}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${bloco.alinhamento === a ? 'bg-white shadow text-[#1A3C4A]' : 'text-gray-400'}`}>
                                        {a === 'esquerda' ? '←' : a === 'centro' ? '↔' : '→'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Ações */}
            <div className="flex gap-3">
                <button type="button" onClick={addBloco}
                    className="flex items-center gap-2 px-5 py-3 bg-[#1A3C4A] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#1A3C4A]/90 transition-all">
                    <Plus className="w-4 h-4" />
                    Adicionar Bloco
                </button>
                <button type="button" onClick={restoreDefault}
                    className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-gray-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">
                    <RotateCcw className="w-4 h-4" />
                    Restaurar Padrão
                </button>
            </div>
        </div>
    )
}
