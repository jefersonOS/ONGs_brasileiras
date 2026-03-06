/**
 * Calcula o valor atualizado de um bem baseado no valor de aquisição,
 * taxa de depreciação anual e tempo decorrido.
 * 
 * Fórmula: Valor Atual = Valor Aquisição * (1 - Taxa Depreciação / 100) ^ anos
 */
export function calcularValorDepreciado(
    valorAquisicao: number,
    taxaAnual: number,
    dataAquisicao: string | Date
): number {
    const dataA = typeof dataAquisicao === 'string' ? new Date(dataAquisicao) : dataAquisicao
    const hoje = new Date()

    // Diferença em milissegundos convertida para anos decimais
    const diffMs = hoje.getTime() - dataA.getTime()
    const anos = Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 365.25))

    const valorAtual = valorAquisicao * Math.pow(1 - (taxaAnual / 100), anos)

    return Number(valorAtual.toFixed(2))
}
