import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowRight, CakeSlice, LoaderCircle, Minus, Plus, ShoppingBag } from 'lucide-react';
import { ResilientImage } from '../../components/ResilientImage';
import { api } from '../../services/api';
import { CriarPedidoRequest, DeliveryType, Pedido, Product, PublicMenuResponse } from '../../types';
import { formatCurrency, formatWeight } from '../../utils/format';

interface CheckoutForm {
    clienteNome: string;
    clienteWhatsapp: string;
    tipoEntrega: DeliveryType;
    endereco: string;
    observacoes: string;
}

const EMPTY_CHECKOUT: CheckoutForm = {
    clienteNome: '',
    clienteWhatsapp: '',
    tipoEntrega: DeliveryType.RETIRADA,
    endereco: '',
    observacoes: '',
};

export function PublicMenuPage() {
    const { slug = '' } = useParams<{ slug: string }>();
    const [menu, setMenu] = useState<PublicMenuResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [checkout, setCheckout] = useState<CheckoutForm>(EMPTY_CHECKOUT);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [confirmedOrder, setConfirmedOrder] = useState<Pedido | null>(null);

    const loadMenu = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setMenu(await api.getPublicMenu(slug));
        } catch (loadError) {
            setError(
                loadError instanceof Error
                    ? loadError.message
                    : 'Não foi possível carregar o cardápio. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    }, [slug]);

    useEffect(() => {
        void loadMenu();
    }, [loadMenu]);

    const products = useMemo(
        () => (menu?.produtos ?? []).filter((product) => product.ativo && product.estoqueAtual > 0),
        [menu]
    );
    const selectedProducts = products.filter((product) => (quantities[product.id] ?? 0) > 0);
    const itemCount = selectedProducts.reduce(
        (sum, product) => sum + (quantities[product.id] ?? 0),
        0
    );
    const total = selectedProducts.reduce(
        (sum, product) => sum + product.precoVenda * (quantities[product.id] ?? 0),
        0
    );

    const updateQuantity = (product: Product, change: number) => {
        setQuantities((current) => {
            const nextQuantity = Math.min(
                product.estoqueAtual,
                Math.max(0, (current[product.id] ?? 0) + change)
            );
            return { ...current, [product.id]: nextQuantity };
        });
    };

    const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (selectedProducts.length === 0) return;
        if (checkout.tipoEntrega === DeliveryType.ENTREGA && !checkout.endereco.trim()) {
            setSubmitError('Informe o endereço para entrega.');
            return;
        }

        const payload: CriarPedidoRequest = {
            clienteNome: checkout.clienteNome.trim(),
            clienteWhatsapp: checkout.clienteWhatsapp.trim(),
            tipoEntrega: checkout.tipoEntrega,
            endereco: checkout.tipoEntrega === DeliveryType.ENTREGA ? checkout.endereco.trim() : undefined,
            observacoes: checkout.observacoes.trim() || undefined,
            itens: selectedProducts.map((product) => ({
                produtoId: Number(product.id),
                quantidade: quantities[product.id],
            })),
        };

        setSubmitting(true);
        setSubmitError(null);
        try {
            const pedido = await api.criarPedidoPublico(slug, payload);
            if (pedido.pagamentoStatus === 'AGUARDANDO' && pedido.pagamentoUrl) {
                window.location.href = pedido.pagamentoUrl;
                return;
            }
            setConfirmedOrder(pedido);
            setQuantities({});
            setCheckout(EMPTY_CHECKOUT);
            void loadMenu();
        } catch (submitErr) {
            setSubmitError(
                submitErr instanceof Error
                    ? submitErr.message
                    : 'Não foi possível enviar o pedido. Tente novamente.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF7F2] text-[#291D16]">
            <header className="border-b border-[#EAE1D5] bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
                    <a href={`/${slug}`} className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B45309] text-white">
                            <CakeSlice className="h-5 w-5" />
                        </span>
                        <span className="font-display text-lg font-semibold tracking-tight">
                            {menu?.loja.nomeLoja || 'Cardápio'}
                        </span>
                    </a>
                    <div className="flex items-center gap-2">
                        <a
                            href={`/${slug}/pedido`}
                            className="rounded-full border border-[#B45309] px-4 py-2 text-sm font-semibold text-[#B45309] transition-colors hover:bg-[#FFF7ED]"
                        >
                            Acompanhar pedido
                        </a>
                    {itemCount > 0 && (
                        <a
                            href="#pedido"
                            className="inline-flex items-center gap-2 rounded-full bg-[#B45309] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#92400E]"
                        >
                            <ShoppingBag className="h-4 w-4" />
                            Meu pedido ({itemCount})
                        </a>
                    )}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
                {loading ? (
                    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-[#7A6658]">
                        <LoaderCircle className="h-8 w-8 animate-spin text-[#B45309]" />
                        <p>Carregando o cardápio...</p>
                    </div>
                ) : error ? (
                    <section className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center text-center">
                        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3ECE2] text-[#B45309]">
                            <CakeSlice className="h-7 w-7" />
                        </span>
                        <h1 className="font-display text-2xl font-semibold">Não encontramos esta loja</h1>
                        <p className="mt-2 text-sm leading-6 text-[#7A6658]">{error}</p>
                        <button
                            type="button"
                            onClick={() => void loadMenu()}
                            className="mt-5 rounded-lg bg-[#B45309] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#92400E]"
                        >
                            Tentar novamente
                        </button>
                    </section>
                ) : menu ? (
                    <>
                        <section className="relative mt-6 flex min-h-64 items-end overflow-hidden rounded-2xl bg-[#513322] sm:min-h-80">
                            {menu.loja.bannerUrl && (
                                <ResilientImage
                                    src={menu.loja.bannerUrl}
                                    alt=""
                                    className="absolute inset-0 h-full w-full object-cover opacity-65"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#291D16]/90 via-[#291D16]/20 to-transparent" />
                            <div className="relative z-10 max-w-2xl px-6 py-7 text-white sm:px-10 sm:py-9">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#F7D9B3]">
                                    Feito com carinho, fresquinho para você
                                </p>
                                <h1 className="font-display text-3xl font-semibold sm:text-5xl">
                                    {menu.loja.nomeLoja}
                                </h1>
                                <p className="mt-3 max-w-xl text-sm leading-6 text-white/90 sm:text-base">
                                    {menu.loja.subtitulo || 'Pudins artesanais preparados com ingredientes selecionados.'}
                                </p>
                            </div>
                        </section>

                        <section className="py-9 sm:py-12">
                            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B45309]">Nosso cardápio</p>
                                    <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Escolha seu pudim favorito</h2>
                                </div>
                                {menu.loja.tempoPreparoMedio && (
                                    <p className="text-sm text-[#7A6658]">
                                        Preparo médio: {menu.loja.tempoPreparoMedio}
                                    </p>
                                )}
                            </div>

                            {products.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[#D9C9B6] bg-white px-5 py-12 text-center">
                                    <p className="font-display text-xl font-semibold">Estamos preparando novidades</p>
                                    <p className="mt-2 text-sm text-[#7A6658]">Nenhum produto disponível no momento. Volte em breve.</p>
                                </div>
                            ) : (
                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {products.map((product) => {
                                        const quantity = quantities[product.id] ?? 0;
                                        return (
                                            <article
                                                key={product.id}
                                                className="overflow-hidden rounded-xl border border-[#EAE1D5] bg-white shadow-sm"
                                            >
                                                <div className="relative aspect-[4/3] overflow-hidden bg-[#F3ECE2]">
                                                    <ResilientImage
                                                        src={product.imagemUrl}
                                                        alt={product.nome}
                                                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                                        fallbackLabel={product.nome}
                                                    />
                                                    {product.destaque && (
                                                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#9A3412] shadow-sm">
                                                            {product.destaque}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h3 className="font-display text-lg font-semibold">{product.nome}</h3>
                                                            <p className="mt-1 text-xs text-[#7A6658]">{formatWeight(product.pesoGramas)}</p>
                                                        </div>
                                                        <p className="shrink-0 text-base font-semibold text-[#9A3412]">
                                                            {formatCurrency(product.precoVenda)}
                                                        </p>
                                                    </div>
                                                    {product.descricao && (
                                                        <p className="mt-3 line-clamp-3 text-sm leading-5 text-[#6B574A]">
                                                            {product.descricao}
                                                        </p>
                                                    )}
                                                    <div className="mt-4 flex items-center justify-between border-t border-[#F0E8DD] pt-3">
                                                        <span className="text-xs text-[#7A6658]">
                                                            {product.estoqueAtual} disponível(is)
                                                        </span>
                                                        {quantity === 0 ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(product, 1)}
                                                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#B45309] px-3 py-2 text-xs font-semibold text-white hover:bg-[#92400E]"
                                                            >
                                                                <Plus className="h-3.5 w-3.5" /> Adicionar
                                                            </button>
                                                        ) : (
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Remover uma unidade de ${product.nome}`}
                                                                    onClick={() => updateQuantity(product, -1)}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EAE1D5] text-[#5C4A3E] hover:bg-[#FAF7F2]"
                                                                >
                                                                    <Minus className="h-4 w-4" />
                                                                </button>
                                                                <span className="min-w-4 text-center text-sm font-semibold">{quantity}</span>
                                                                <button
                                                                    type="button"
                                                                    aria-label={`Adicionar uma unidade de ${product.nome}`}
                                                                    disabled={quantity >= product.estoqueAtual}
                                                                    onClick={() => updateQuantity(product, 1)}
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EAE1D5] text-[#5C4A3E] hover:bg-[#FAF7F2] disabled:opacity-40"
                                                                >
                                                                    <Plus className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {confirmedOrder && (
                            <section className="mt-6 rounded-2xl border border-[#BBE5CB] bg-[#F1FBF5] p-6 text-center">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#16834A]">Pedido recebido</p>
                                <h2 className="mt-2 font-display text-2xl font-semibold">Obrigado, {confirmedOrder.clienteNome}!</h2>
                                <p className="mt-2 text-sm text-[#4B5D52]">
                                    Seu código de pedido é <strong className="font-mono">{confirmedOrder.codigo}</strong>. Guarde-o para acompanhar seu pedido.
                                </p>
                                <p className="mt-1 text-sm text-[#4B5D52]">Total: {formatCurrency(confirmedOrder.valorTotal)}</p>
                                <button
                                    type="button"
                                    onClick={() => setConfirmedOrder(null)}
                                    className="mt-4 text-sm font-semibold text-[#16834A] underline"
                                >
                                    Fazer outro pedido
                                </button>
                                <a
                                    href={`/${slug}/pedido?whatsapp=${encodeURIComponent(confirmedOrder.clienteWhatsapp)}`}
                                    className="mt-4 ml-4 inline-block text-sm font-semibold text-[#16834A] underline"
                                >
                                    Acompanhar pedido
                                </a>
                            </section>
                        )}

                        {itemCount > 0 && (
                            <section id="pedido" className="scroll-mt-24 rounded-2xl border border-[#EADBC8] bg-white p-5 sm:p-7">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <h2 className="font-display text-xl font-semibold">Seu pedido</h2>
                                        <p className="mt-1 text-sm text-[#7A6658]">
                                            {itemCount} item(ns) · Total {formatCurrency(total)}
                                        </p>
                                    </div>
                                </div>

                                {menu.loja.abertaParaEncomendas ? (
                                    <form onSubmit={submitOrder} className="mt-6 grid gap-4 sm:grid-cols-2">
                                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                                            Seu nome
                                            <input
                                                required
                                                value={checkout.clienteNome}
                                                onChange={(e) => setCheckout({ ...checkout, clienteNome: e.target.value })}
                                                className="rounded-lg border border-[#EAE1D5] px-3 py-2.5 text-sm font-normal focus:border-[#B45309] focus:outline-none"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1.5 text-sm font-medium">
                                            WhatsApp
                                            <input
                                                required
                                                inputMode="tel"
                                                value={checkout.clienteWhatsapp}
                                                onChange={(e) => setCheckout({ ...checkout, clienteWhatsapp: e.target.value })}
                                                className="rounded-lg border border-[#EAE1D5] px-3 py-2.5 text-sm font-normal focus:border-[#B45309] focus:outline-none"
                                            />
                                        </label>
                                        <fieldset className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">
                                            <legend className="mb-1.5">Como prefere receber?</legend>
                                            <div className="flex gap-3">
                                                {[
                                                    { value: DeliveryType.RETIRADA, label: 'Retirar na loja' },
                                                    { value: DeliveryType.ENTREGA, label: 'Entrega' },
                                                ].map((option) => (
                                                    <label
                                                        key={option.value}
                                                        className={`flex-1 cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm font-normal ${
                                                            checkout.tipoEntrega === option.value
                                                                ? 'border-[#B45309] bg-[#FAF3E8] text-[#8A4B18]'
                                                                : 'border-[#EAE1D5]'
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="tipoEntrega"
                                                            value={option.value}
                                                            checked={checkout.tipoEntrega === option.value}
                                                            onChange={() => setCheckout({ ...checkout, tipoEntrega: option.value })}
                                                            className="sr-only"
                                                        />
                                                        {option.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </fieldset>
                                        {checkout.tipoEntrega === DeliveryType.ENTREGA && (
                                            <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">
                                                Endereço de entrega
                                                <input
                                                    required
                                                    value={checkout.endereco}
                                                    onChange={(e) => setCheckout({ ...checkout, endereco: e.target.value })}
                                                    className="rounded-lg border border-[#EAE1D5] px-3 py-2.5 text-sm font-normal focus:border-[#B45309] focus:outline-none"
                                                />
                                            </label>
                                        )}
                                        <label className="flex flex-col gap-1.5 text-sm font-medium sm:col-span-2">
                                            Observações
                                            <textarea
                                                rows={2}
                                                value={checkout.observacoes}
                                                onChange={(e) => setCheckout({ ...checkout, observacoes: e.target.value })}
                                                className="rounded-lg border border-[#EAE1D5] px-3 py-2.5 text-sm font-normal focus:border-[#B45309] focus:outline-none"
                                            />
                                        </label>
                                        {submitError && (
                                            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{submitError}</p>
                                        )}
                                        <div className="sm:col-span-2">
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="inline-flex items-center gap-2 rounded-lg bg-[#B45309] px-5 py-3 text-sm font-semibold text-white hover:bg-[#92400E] disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {submitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                                Confirmar pedido <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <p className="mt-6 rounded-lg bg-[#FAF3E8] px-4 py-3 text-sm font-medium text-[#8A4B18]">
                                        A loja está fechada para encomendas no momento.
                                    </p>
                                )}
                            </section>
                        )}

                    </>
                ) : null}
            </main>
            <footer className="border-t border-[#EAE1D5] bg-white px-5 py-5 text-center text-xs text-[#7A6658]">
                Cardápio online · {menu?.loja.nomeLoja || 'Confeitaria artesanal'}
            </footer>
        </div>
    );
}
