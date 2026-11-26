import { useEffect, useState } from 'react';
import { Download, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { api } from '../../services/api';
import type { CompradorProduto, Product } from '../../types';

const dataFormatada = (valor: string) => new Date(valor).toLocaleString('pt-BR');
const moeda = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function exportarExcel(linhas: CompradorProduto[], nomeArquivo: string) {
    const planilha = linhas.map((l) => ({
        Pedido: l.pedidoId,
        Código: l.codigoPedido,
        Data: dataFormatada(l.criadoEm),
        Status: l.status,
        Cliente: l.clienteNome,
        WhatsApp: l.clienteWhatsapp,
        'E-mail': l.clienteEmail ?? '',
        Produto: l.produtoNome,
        Quantidade: l.quantidade,
        'Preço unitário': l.precoUnitario,
    }));

    const ws = XLSX.utils.json_to_sheet(planilha);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Compradores');
    XLSX.writeFile(wb, nomeArquivo);
}

export function ReportsPage() {
    const [produtos, setProdutos] = useState<Product[]>([]);
    const [produtoId, setProdutoId] = useState<string>('');
    const [linhas, setLinhas] = useState<CompradorProduto[] | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        api.getProducts().then(setProdutos).catch(() => setProdutos([]));
    }, []);

    const buscar = async () => {
        setCarregando(true);
        setErro(null);
        try {
            const dados = await api.relatorioCompradores(produtoId ? Number(produtoId) : undefined);
            setLinhas(dados);
        } catch (e) {
            setErro(e instanceof Error ? e.message : 'Não foi possível gerar o relatório.');
        } finally {
            setCarregando(false);
        }
    };

    const exportar = () => {
        if (!linhas?.length) return;
        const sufixo = produtoId ? `produto-${produtoId}` : 'todos-produtos';
        exportarExcel(linhas, `relatorio-compradores-${sufixo}.xlsx`);
    };

    return (
        <section className="space-y-5">
            <div className="rounded-xl border border-[#EAE1D5] bg-white p-5">
                <h2 className="font-display text-base font-semibold text-[#291D16]">Compradores por produto</h2>
                <p className="mt-1 text-sm text-[#7A6658]">
                    Lista quem comprou cada produto. Pedidos cancelados não entram no relatório.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="flex-1 text-sm font-medium text-[#5C4A3E]">
                        Produto
                        <select
                            value={produtoId}
                            onChange={(e) => setProdutoId(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-[#EAE1D5] bg-white px-3 py-2 text-sm text-[#291D16]"
                        >
                            <option value="">Todos os produtos</option>
                            {produtos.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nome}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={buscar}
                            disabled={carregando}
                            className="inline-flex items-center gap-2 rounded-lg bg-[#9A3412] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7C2D12] disabled:opacity-60"
                        >
                            <Search className="h-4 w-4" />
                            {carregando ? 'Gerando...' : 'Gerar relatório'}
                        </button>
                        <button
                            type="button"
                            onClick={exportar}
                            disabled={!linhas?.length}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#EAE1D5] bg-white px-4 py-2 text-sm font-semibold text-[#291D16] hover:bg-[#FAF7F2] disabled:opacity-60"
                        >
                            <Download className="h-4 w-4" />
                            Exportar Excel
                        </button>
                    </div>
                </div>

                {erro && (
                    <p role="alert" className="mt-3 text-sm text-red-700">
                        {erro}
                    </p>
                )}
            </div>

            {linhas && (
                <div className="overflow-x-auto rounded-xl border border-[#EAE1D5] bg-white">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-[#FAF7F2] text-xs uppercase text-[#7A6658]">
                            <tr>
                                <th className="px-4 py-3">Pedido</th>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">WhatsApp</th>
                                <th className="px-4 py-3">E-mail</th>
                                <th className="px-4 py-3">Produto</th>
                                <th className="px-4 py-3 text-right">Qtd</th>
                                <th className="px-4 py-3 text-right">Preço unit.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F2EAE0]">
                            {linhas.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-4 py-6 text-center text-[#7A6658]">
                                        Nenhuma compra encontrada.
                                    </td>
                                </tr>
                            )}
                            {linhas.map((l, i) => (
                                <tr key={`${l.pedidoId}-${l.produtoId}-${i}`}>
                                    <td className="px-4 py-3 font-medium">{l.codigoPedido}</td>
                                    <td className="px-4 py-3">{dataFormatada(l.criadoEm)}</td>
                                    <td className="px-4 py-3">{l.status}</td>
                                    <td className="px-4 py-3">{l.clienteNome}</td>
                                    <td className="px-4 py-3">{l.clienteWhatsapp}</td>
                                    <td className="px-4 py-3">{l.clienteEmail ?? '—'}</td>
                                    <td className="px-4 py-3">{l.produtoNome}</td>
                                    <td className="px-4 py-3 text-right">{l.quantidade}</td>
                                    <td className="px-4 py-3 text-right">{moeda(l.precoUnitario)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
