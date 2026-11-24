import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, LoaderCircle, RefreshCw, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { DeliveryType, Pedido, PedidoStatus } from '../../types';
import { formatCurrency } from '../../utils/format';

const COLUMNS: { status: PedidoStatus; label: string; next?: PedidoStatus; nextLabel?: string }[] = [
    { status: 'PENDENTE', label: 'Pendente', next: 'EM_PREPARO', nextLabel: 'Iniciar preparo' },
    { status: 'EM_PREPARO', label: 'Em preparo', next: 'PRONTO_PARA_ENTREGA', nextLabel: 'Marcar pronto' },
    { status: 'PRONTO_PARA_ENTREGA', label: 'Pronto', next: 'SAIU_PARA_ENTREGA', nextLabel: 'Saiu para entrega' },
    { status: 'SAIU_PARA_ENTREGA', label: 'Saiu para entrega', next: 'ENTREGUE', nextLabel: 'Marcar entregue' },
    { status: 'ENTREGUE', label: 'Entregue' },
];

const CANCELABLE: PedidoStatus[] = ['PENDENTE', 'EM_PREPARO', 'PRONTO_PARA_ENTREGA', 'SAIU_PARA_ENTREGA'];
const REFRESH_INTERVAL_MS = 30_000;

interface Feedback {
    type: 'success' | 'error';
    message: string;
}

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

export function OrdersPage() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const loadPedidos = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            setPedidos(await api.listarPedidos());
            setLoadError(null);
        } catch (error) {
            setLoadError(errorMessage(error, 'Não foi possível carregar os pedidos.'));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadPedidos();
        const timer = window.setInterval(() => void loadPedidos(true), REFRESH_INTERVAL_MS);
        return () => window.clearInterval(timer);
    }, [loadPedidos]);

    useEffect(() => {
        if (!feedback) return;
        const timer = window.setTimeout(() => setFeedback(null), 4000);
        return () => window.clearTimeout(timer);
    }, [feedback]);

    const changeStatus = async (pedido: Pedido, novoStatus: PedidoStatus, successText: string) => {
        setUpdatingId(pedido.id);
        setFeedback(null);
        try {
            await api.atualizarStatusPedido(pedido.id, { novoStatus });
            setFeedback({ type: 'success', message: `${successText} (${pedido.codigo})` });
            await loadPedidos(true);
        } catch (error) {
            setFeedback({ type: 'error', message: errorMessage(error, 'Não foi possível atualizar o pedido.') });
        } finally {
            setUpdatingId(null);
        }
    };

    const handleCancel = (pedido: Pedido) => {
        if (!window.confirm(`Cancelar o pedido ${pedido.codigo}? O estoque será devolvido.`)) return;
        void changeStatus(pedido, 'CANCELADO', 'Pedido cancelado');
    };

    const cancelados = pedidos.filter((p) => p.status === 'CANCELADO').length;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[#7A6658]">
                    {pedidos.length} pedido(s) ativos · {cancelados} cancelado(s)
                </p>
                <button
                    type="button"
                    onClick={() => void loadPedidos()}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#EAE1D5] bg-white px-3 py-2 text-sm font-medium text-[#5C4A3E] hover:bg-[#FAF7F2]"
                >
                    <RefreshCw className="h-4 w-4" /> Atualizar
                </button>
            </div>

            {feedback && (
                <div
                    role="status"
                    className={`rounded-lg px-4 py-3 text-sm font-medium ${
                        feedback.type === 'success'
                            ? 'bg-[#ECFDF3] text-[#166534]'
                            : 'bg-[#FEF2F2] text-[#991B1B]'
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            {loadError && (
                <div role="alert" className="rounded-lg bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
                    {loadError}
                </div>
            )}

            {loading ? (
                <div className="flex items-center gap-2 text-sm text-[#7A6658]">
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Carregando pedidos...
                </div>
            ) : (
                <div className="grid gap-4 overflow-x-auto pb-2 xl:grid-cols-5">
                    {COLUMNS.map((column) => {
                        const cards = pedidos.filter((p) => p.status === column.status);
                        return (
                            <section
                                key={column.status}
                                aria-label={column.label}
                                className="min-w-[240px] rounded-xl border border-[#EAE1D5] bg-white p-3"
                            >
                                <header className="mb-3 flex items-center justify-between">
                                    <h2 className="font-display text-sm font-semibold text-[#291D16]">{column.label}</h2>
                                    <span className="rounded-full bg-[#FAF3E8] px-2 py-0.5 text-xs font-semibold text-[#9A3412]">
                                        {cards.length}
                                    </span>
                                </header>

                                <div className="space-y-3">
                                    {cards.length === 0 && (
                                        <p className="rounded-lg border border-dashed border-[#EAE1D5] p-3 text-center text-xs text-[#A0907F]">
                                            Nenhum pedido
                                        </p>
                                    )}
                                    {cards.map((pedido) => {
                                        const busy = updatingId === pedido.id;
                                        return (
                                            <article key={pedido.id} className="rounded-lg border border-[#F2EAE0] bg-[#FFFCF8] p-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-xs font-semibold text-[#9A3412]">{pedido.codigo}</p>
                                                    <span className="text-[11px] text-[#7A6658]">
                                                        {pedido.tipoEntrega === DeliveryType.ENTREGA ? 'Entrega' : 'Retirada'}
                                                    </span>
                                                </div>
                                                <p className="mt-1 font-medium text-[#291D16]">{pedido.clienteNome}</p>
                                                <p className="text-xs text-[#7A6658]">{pedido.clienteWhatsapp}</p>

                                                <ul className="mt-2 space-y-0.5 text-xs text-[#5C4A3E]">
                                                    {pedido.itens.map((item) => (
                                                        <li key={`${pedido.id}-${item.produtoId}`}>
                                                            {item.quantidade}x {item.produtoNome}
                                                        </li>
                                                    ))}
                                                </ul>

                                                {pedido.tipoEntrega === DeliveryType.ENTREGA && pedido.endereco && (
                                                    <p className="mt-2 text-xs text-[#7A6658]">📍 {pedido.endereco}</p>
                                                )}
                                                {pedido.observacoes && (
                                                    <p className="mt-1 text-xs italic text-[#7A6658]">“{pedido.observacoes}”</p>
                                                )}

                                                <p className="mt-2 text-sm font-semibold text-[#291D16]">
                                                    {formatCurrency(pedido.valorTotal)}
                                                </p>

                                                <div className="mt-3 flex flex-col gap-2">
                                                    {column.next && column.nextLabel && (
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() =>
                                                                void changeStatus(pedido, column.next!, `Pedido avançado para ${column.nextLabel}`)
                                                            }
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#B45309] px-3 py-2 text-xs font-semibold text-white hover:bg-[#9A3412] disabled:opacity-50"
                                                        >
                                                            {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                                                            {column.nextLabel}
                                                        </button>
                                                    )}
                                                    {CANCELABLE.includes(pedido.status) && (
                                                        <button
                                                            type="button"
                                                            disabled={busy}
                                                            onClick={() => handleCancel(pedido)}
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#FECACA] px-3 py-1.5 text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] disabled:opacity-50"
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" /> Cancelar
                                                        </button>
                                                    )}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
