import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { DollarSign, LoaderCircle, Package, RefreshCw, ShoppingBag, TrendingUp } from 'lucide-react';
import { api } from '../../services/api';
import { DashboardData, PedidoStatus } from '../../types';
import { formatCurrency } from '../../utils/format';

const STATUS_LABELS: Record<PedidoStatus, string> = {
    PENDENTE: 'Pendente',
    EM_PREPARO: 'Em preparo',
    PRONTO_PARA_ENTREGA: 'Pronto',
    ENTREGUE: 'Entregue',
    CANCELADO: 'Cancelado',
};

const STATUS_COLORS: Record<PedidoStatus, string> = {
    PENDENTE: 'bg-[#FEF3C7] text-[#B45309]',
    EM_PREPARO: 'bg-[#DBEAFE] text-[#1D4ED8]',
    PRONTO_PARA_ENTREGA: 'bg-[#EDE9FE] text-[#6D28D9]',
    ENTREGUE: 'bg-[#DCFCE7] text-[#166534]',
    CANCELADO: 'bg-[#FEE2E2] text-[#991B1B]',
};

const REFRESH_INTERVAL_MS = 60_000;

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function formatDateTime(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR');
}

interface MetricCardProps {
    title: string;
    value: string;
    hint?: string;
    icon: ReactNode;
}

function MetricCard({ title, value, hint, icon }: MetricCardProps) {
    return (
        <div className="rounded-xl border border-[#EAE1D5] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-[#7A6658]">{title}</p>
                    <p className="mt-2 text-2xl font-bold text-[#291D16]">{value}</p>
                    {hint && <p className="mt-1 text-xs text-[#7A6658]">{hint}</p>}
                </div>
                <div className="rounded-lg bg-[#FAF7F2] p-2 text-[#B45309]">{icon}</div>
            </div>
        </div>
    );
}

export function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDashboard = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            setData(await api.buscarDashboard());
            setError(null);
        } catch (err) {
            setError(errorMessage(err, 'Não foi possível carregar o dashboard.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadDashboard();
        const timer = window.setInterval(() => void loadDashboard(true), REFRESH_INTERVAL_MS);
        return () => window.clearInterval(timer);
    }, [loadDashboard]);

    if (loading && !data) {
        return (
            <div className="flex items-center gap-2 text-sm text-[#7A6658]">
                <LoaderCircle className="h-4 w-4 animate-spin" /> Carregando dashboard...
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="space-y-4">
                <div role="alert" className="rounded-lg bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
                    {error}
                </div>
                <button
                    type="button"
                    onClick={() => void loadDashboard()}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#EAE1D5] bg-white px-3 py-2 text-sm font-medium text-[#5C4A3E] hover:bg-[#FAF7F2]"
                >
                    <RefreshCw className="h-4 w-4" /> Tentar novamente
                </button>
            </div>
        );
    }

    if (!data) return null;

    const maxStatusCount = Math.max(1, ...Object.values(data.pedidosPorStatus));
    const maxProdutoQtd = Math.max(1, ...data.topProdutos.map((p) => p.quantidade));

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-[#291D16]">Dashboard</h2>
                <button
                    type="button"
                    onClick={() => void loadDashboard()}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#EAE1D5] bg-white px-3 py-2 text-sm font-medium text-[#5C4A3E] hover:bg-[#FAF7F2]"
                >
                    <RefreshCw className="h-4 w-4" /> Atualizar
                </button>
            </div>

            {error && (
                <div role="alert" className="rounded-lg bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
                    {error}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Faturamento hoje"
                    value={formatCurrency(data.faturamentoHoje)}
                    hint={`${data.pedidosHoje} pedido(s) hoje`}
                    icon={<DollarSign className="h-5 w-5" />}
                />
                <MetricCard
                    title="Faturamento total"
                    value={formatCurrency(data.faturamentoTotal)}
                    hint="Exclui pedidos cancelados"
                    icon={<TrendingUp className="h-5 w-5" />}
                />
                <MetricCard
                    title="Pedidos em andamento"
                    value={String(data.pedidosAtivos)}
                    hint={`${data.totalPedidos} pedido(s) no total`}
                    icon={<ShoppingBag className="h-5 w-5" />}
                />
                <MetricCard
                    title="Ticket médio"
                    value={formatCurrency(data.ticketMedio)}
                    hint="Por pedido válido"
                    icon={<Package className="h-5 w-5" />}
                />
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                <section className="rounded-xl border border-[#EAE1D5] bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-base font-semibold text-[#291D16]">Pedidos por status</h3>
                    <ul className="space-y-3">
                        {(Object.keys(STATUS_LABELS) as PedidoStatus[]).map((status) => {
                            const count = data.pedidosPorStatus[status] ?? 0;
                            const width = `${Math.round((count / maxStatusCount) * 100)}%`;
                            return (
                                <li key={status}>
                                    <div className="mb-1 flex justify-between text-sm">
                                        <span className="text-[#5C4A3E]">{STATUS_LABELS[status]}</span>
                                        <span className="font-semibold text-[#291D16]">{count}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-[#F5EFE6]">
                                        <div className="h-2 rounded-full bg-[#B45309]" style={{ width }} />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                <section className="rounded-xl border border-[#EAE1D5] bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-base font-semibold text-[#291D16]">Produtos mais vendidos</h3>
                    {data.topProdutos.length === 0 ? (
                        <p className="text-sm text-[#7A6658]">Nenhuma venda registrada ainda.</p>
                    ) : (
                        <ul className="space-y-3">
                            {data.topProdutos.map((produto) => {
                                const width = `${Math.round((produto.quantidade / maxProdutoQtd) * 100)}%`;
                                return (
                                    <li key={produto.produtoId}>
                                        <div className="mb-1 flex justify-between text-sm">
                                            <span className="truncate pr-2 text-[#5C4A3E]">{produto.produtoNome}</span>
                                            <span className="shrink-0 font-semibold text-[#291D16]">
                                                {produto.quantidade} un · {formatCurrency(produto.faturamento)}
                                            </span>
                                        </div>
                                        <div className="h-2 rounded-full bg-[#F5EFE6]">
                                            <div className="h-2 rounded-full bg-[#7A6658]" style={{ width }} />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                <section className="rounded-xl border border-[#EAE1D5] bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-base font-semibold text-[#291D16]">Pedidos recentes</h3>
                    {data.pedidosRecentes.length === 0 ? (
                        <p className="text-sm text-[#7A6658]">Nenhum pedido ainda.</p>
                    ) : (
                        <ul className="divide-y divide-[#F5EFE6]">
                            {data.pedidosRecentes.map((pedido) => (
                                <li key={pedido.id} className="flex items-center justify-between gap-3 py-3">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#291D16]">
                                            {pedido.clienteNome}
                                        </p>
                                        <p className="text-xs text-[#7A6658]">
                                            {pedido.codigo} · {formatDateTime(pedido.criadoEm)}
                                        </p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-semibold text-[#291D16]">
                                            {formatCurrency(pedido.valorTotal)}
                                        </p>
                                        <span
                                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[pedido.status]}`}
                                        >
                                            {STATUS_LABELS[pedido.status]}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}
