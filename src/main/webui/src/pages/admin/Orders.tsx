import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, LoaderCircle, RefreshCw, Search, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { DeliveryType, Pedido, PedidoStatus } from '../../types';
import { formatCurrency } from '../../utils/format';

const COLUMNS: { status: PedidoStatus; label: string; next?: PedidoStatus; nextLabel?: string }[] = [
    { status: 'PENDENTE', label: 'Pendente', next: 'EM_PREPARO', nextLabel: 'Iniciar preparo' },
    { status: 'EM_PREPARO', label: 'Em preparo', next: 'PRONTO_PARA_ENTREGA', nextLabel: 'Marcar pronto' },
    { status: 'PRONTO_PARA_ENTREGA', label: 'Pronto', next: 'ENTREGUE', nextLabel: 'Marcar entregue' },
    { status: 'ENTREGUE', label: 'Entregue' },
];

const CANCELABLE: PedidoStatus[] = ['PENDENTE', 'EM_PREPARO', 'PRONTO_PARA_ENTREGA'];
const REFRESH_INTERVAL_MS = 15_000;

interface Feedback {
    type: 'success' | 'error';
    message: string;
}

interface PendingOrderAction {
    pedido: Pedido;
    novoStatus: PedidoStatus;
    title: string;
    message: string;
    confirmLabel: string;
    successText: string;
    tone: 'default' | 'danger';
}

function errorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

function playNewOrderSound() {
    try {
        const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtor();
        [0, 0.25].forEach((offset) => {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            gain.gain.setValueAtTime(0.2, ctx.currentTime + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.2);
            oscillator.connect(gain).connect(ctx.destination);
            oscillator.start(ctx.currentTime + offset);
            oscillator.stop(ctx.currentTime + offset + 0.2);
        });
        window.setTimeout(() => void ctx.close(), 1000);
    } catch {
        // Navegadores sem Web Audio ou com áudio bloqueado: o aviso visual continua funcionando.
    }
}

function normalizeText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function OrdersPage() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [busca, setBusca] = useState('');
    const [pendingAction, setPendingAction] = useState<PendingOrderAction | null>(null);
    // null = ainda não carregou; o primeiro carregamento só registra os pagos existentes, sem alertar.
    const knownPaidIds = useRef<Set<number> | null>(null);

    const pedidosFiltrados = useMemo(() => {
        const termo = normalizeText(busca);
        const digitos = busca.replace(/\D/g, '');
        if (!termo) return pedidos;
        return pedidos.filter((p) => {
            const nome = normalizeText(p.clienteNome);
            const codigo = normalizeText(p.codigo);
            const whatsapp = p.clienteWhatsapp.replace(/\D/g, '');
            return (
                nome.includes(termo) ||
                codigo.includes(termo) ||
                (digitos.length > 0 && whatsapp.includes(digitos))
            );
        });
    }, [pedidos, busca]);

    const loadPedidos = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const lista = await api.listarPedidos();
            setPedidos(lista);
            setLoadError(null);

            const paidIds = lista.filter((p) => p.pagamentoStatus === 'PAGO').map((p) => p.id);
            const known = knownPaidIds.current;
            if (known) {
                const novos = lista.filter((p) => p.pagamentoStatus === 'PAGO' && !known.has(p.id));
                if (novos.length > 0) {
                    playNewOrderSound();
                    const texto = novos.length === 1
                        ? `Novo pedido pago: ${novos[0].codigo} (${novos[0].clienteNome})`
                        : `${novos.length} novos pedidos pagos`;
                    setFeedback({ type: 'success', message: texto });
                }
            }
            knownPaidIds.current = new Set(paidIds);
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
        setPendingAction({
            pedido,
            novoStatus: 'CANCELADO',
            title: 'Cancelar pedido',
            message: `Cancelar o pedido ${pedido.codigo}? O estoque será devolvido.`,
            confirmLabel: 'Sim, cancelar',
            successText: 'Pedido cancelado',
            tone: 'danger',
        });
    };

    const requestAdvance = (pedido: Pedido, novoStatus: PedidoStatus, nextLabel: string) => {
        setPendingAction({
            pedido,
            novoStatus,
            title: nextLabel,
            message: `Confirmar a ação "${nextLabel}" no pedido ${pedido.codigo} (${pedido.clienteNome})?`,
            confirmLabel: nextLabel,
            successText: `Pedido avançado para ${nextLabel}`,
            tone: 'default',
        });
    };

    const confirmPendingAction = () => {
        if (!pendingAction) return;
        const { pedido, novoStatus, successText } = pendingAction;
        setPendingAction(null);
        void changeStatus(pedido, novoStatus, successText);
    };

    const cancelados = pedidos.filter((p) => p.status === 'CANCELADO').length;

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#7A6658]">
                    {pedidos.length} pedido(s) ativos · {cancelados} cancelado(s)
                </p>
                <button
                    type="button"
                    onClick={() => void loadPedidos()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#EAE1D5] bg-white px-3 py-2 text-sm font-medium text-[#5C4A3E] hover:bg-[#FAF7F2] sm:w-auto"
                >
                    <RefreshCw className="h-4 w-4" /> Atualizar
                </button>
            </div>

            <div className="relative w-full lg:max-w-lg">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A0907F]" />
                <input
                    type="search"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Buscar por nome, código ou WhatsApp"
                    aria-label="Buscar pedidos"
                    className="w-full rounded-lg border border-[#EAE1D5] bg-white py-2 pl-9 pr-3 text-sm text-[#291D16] placeholder:text-[#A0907F] focus:border-[#B45309] focus:outline-none"
                />
            </div>

            {busca && (
                <p className="text-xs text-[#7A6658]">
                    {pedidosFiltrados.length} resultado(s) para “{busca}”
                </p>
            )}

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
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {COLUMNS.map((column) => {
                        const cards = pedidosFiltrados.filter((p) => p.status === column.status);
                        return (
                            <section
                                key={column.status}
                                aria-label={column.label}
                                className="flex min-w-0 flex-col rounded-xl border border-[#EAE1D5] bg-white p-3"
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

                                                {pedido.pagamentoStatus === 'PAGO' && (
                                                    <span className="mt-1.5 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                                        Pago{pedido.pagoEm ? ` em ${new Date(pedido.pagoEm).toLocaleString('pt-BR')}` : ''}
                                                    </span>
                                                )}
                                                {pedido.pagamentoStatus === 'AGUARDANDO' && (
                                                    <span className="mt-1.5 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                                        Aguardando pagamento
                                                    </span>
                                                )}

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
                                                            onClick={() => requestAdvance(pedido, column.next!, column.nextLabel!)}
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

            <ConfirmDialog
                open={pendingAction !== null}
                title={pendingAction?.title ?? ''}
                message={pendingAction?.message ?? ''}
                confirmLabel={pendingAction?.confirmLabel}
                tone={pendingAction?.tone}
                onConfirm={confirmPendingAction}
                onCancel={() => setPendingAction(null)}
            />
        </div>
    );
}
