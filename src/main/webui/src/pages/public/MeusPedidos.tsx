import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LoaderCircle, Search } from 'lucide-react';
import { api } from '../../services/api';
import { DeliveryType, Pedido, PedidoStatus } from '../../types';
import { formatCurrency } from '../../utils/format';

const TIMELINE: PedidoStatus[] = ['PENDENTE', 'EM_PREPARO', 'PRONTO_PARA_ENTREGA', 'ENTREGUE'];

const STATUS_LABEL: Record<PedidoStatus, string> = {
  PENDENTE: 'Pedido recebido',
  EM_PREPARO: 'Em preparo',
  PRONTO_PARA_ENTREGA: 'Pronto',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

const STATUS_HINT: Record<PedidoStatus, string> = {
  PENDENTE: 'Recebemos seu pedido e vamos começar em breve.',
  EM_PREPARO: 'Seu pudim está sendo preparado com carinho.',
  PRONTO_PARA_ENTREGA: 'Seu pedido está pronto para retirada ou entrega.',
  ENTREGUE: 'Pedido finalizado. Obrigado pela preferência!',
  CANCELADO: 'Este pedido foi cancelado. Entre em contato com a loja se tiver dúvidas.',
};

const DELIVERY_LABEL: Record<DeliveryType, string> = {
  [DeliveryType.ENTREGA]: 'Entrega',
  [DeliveryType.RETIRADA]: 'Retirada na loja',
};

const REFRESH_INTERVAL_MS = 30_000;

function formatDateTime(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function PedidoCard({ pedido, slug }: { pedido: Pedido; slug: string }) {
  const etapaAtual = TIMELINE.indexOf(pedido.status);
  const [pagando, setPagando] = useState(false);
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);

  const pagarAgora = async () => {
    setPagando(true);
    setErroPagamento(null);
    try {
      const atualizado = await api.gerarPagamentoPublico(slug, pedido.codigo, pedido.clienteWhatsapp);
      if (atualizado.pagamentoUrl) {
        window.location.href = atualizado.pagamentoUrl;
        return;
      }
      setErroPagamento('Não foi possível gerar o link de pagamento.');
    } catch (err) {
      setErroPagamento(err instanceof Error ? err.message : 'Não foi possível gerar o link de pagamento.');
    } finally {
      setPagando(false);
    }
  };

  return (
    <article className="rounded-2xl border border-[#EADBC8] bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-[#7A6658]">{pedido.codigo}</p>
          <h2 className="mt-1 font-display text-xl font-semibold">{pedido.clienteNome}</h2>
          <p className="mt-1 text-sm text-[#7A6658]">
            {DELIVERY_LABEL[pedido.tipoEntrega]} · feito em {formatDateTime(pedido.criadoEm)}
          </p>
        </div>
        <span className="rounded-full bg-[#FFF1DC] px-3 py-1 text-xs font-semibold text-[#B45309]">
          {STATUS_LABEL[pedido.status]}
        </span>
      </div>

      <p className="mt-4 rounded-xl bg-[#FBF5EE] px-4 py-3 text-sm text-[#4B5D52]">{STATUS_HINT[pedido.status]}</p>

      {pedido.status !== 'CANCELADO' && (
        <ol className="mt-6 space-y-4">
          {TIMELINE.map((status, index) => {
            const concluido = index <= etapaAtual;
            return (
              <li key={status} className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                    concluido ? 'border-[#16834A] bg-[#16834A] text-white' : 'border-[#D9C7B5] bg-white text-transparent'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <span className={`text-sm ${concluido ? 'font-semibold text-[#291D16]' : 'text-[#9C8A7A]'}`}>
                  {STATUS_LABEL[status]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mt-6 border-t border-[#EADBC8] pt-4">
        <ul className="divide-y divide-[#F0E4D6]">
          {pedido.itens.map((item) => (
            <li key={`${item.produtoId}-${item.produtoNome}`} className="flex justify-between py-2.5 text-sm">
              <span>
                {item.quantidade}x {item.produtoNome}
              </span>
              <span className="font-medium">{formatCurrency(item.subtotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span>{formatCurrency(pedido.valorTotal)}</span>
        </div>
        {pedido.endereco && <p className="mt-3 text-sm text-[#4B5D52]">Endereço: {pedido.endereco}</p>}
        {pedido.observacoes && <p className="mt-1 text-sm text-[#4B5D52]">Obs.: {pedido.observacoes}</p>}
        {pedido.pagamentoStatus === 'PAGO' && (
          <p className="mt-3 rounded-xl bg-[#E8F7EE] px-4 py-3 text-sm font-semibold text-[#16834A]">
            Pagamento confirmado{pedido.pagoEm ? ` em ${formatDateTime(pedido.pagoEm)}` : ''}.
          </p>
        )}
        {pedido.pagamentoStatus === 'AGUARDANDO' && (
          <>
            <button
              type="button"
              onClick={pagarAgora}
              disabled={pagando}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#16834A] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pagando ? 'Gerando link...' : 'Pagar agora'}
            </button>
            {erroPagamento && <p className="mt-2 text-sm text-red-600">{erroPagamento}</p>}
          </>
        )}
      </div>
    </article>
  );
}

export function OrderTrackingPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const whatsappInicial = searchParams.get('whatsapp') ?? '';

  const [whatsapp, setWhatsapp] = useState(whatsappInicial);
  const [consultaWhatsapp, setConsultaWhatsapp] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const consultar = useCallback(async (telefone: string, silencioso = false) => {
    if (!silencioso) setLoading(true);
    try {
      const data = await api.listarPedidosPublicos(slug, telefone.trim());
      setPedidos(data);
      setConsultaWhatsapp(telefone.trim());
      setError(null);
    } catch (err) {
      if (!silencioso) {
        setPedidos(null);
        setError(
          err instanceof Error && err.message
            ? err.message
            : 'Não foi possível buscar seus pedidos. Tente novamente.',
        );
      }
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (whatsappInicial.trim()) {
      void consultar(whatsappInicial);
    }
  }, [whatsappInicial, consultar]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!whatsapp.trim()) {
      setError('Informe o número de WhatsApp usado na compra.');
      return;
    }
    void consultar(whatsapp);
  }

  const existeAtivo = pedidos?.some((p) => p.status !== 'ENTREGUE' && p.status !== 'CANCELADO') ?? false;

  useEffect(() => {
    if (!existeAtivo || !consultaWhatsapp) return;
    const timer = window.setInterval(() => {
      void consultar(consultaWhatsapp, true);
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [existeAtivo, consultaWhatsapp, consultar]);

  return (
    <div className="min-h-screen bg-[#FFF8F0] text-[#291D16]">
      <header className="border-b border-[#EADBC8] bg-white/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <a href={`/${slug}`} className="font-display text-lg font-semibold">
            Voltar ao cardápio
          </a>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7A6658]">Acompanhar pedido</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <section className="rounded-2xl border border-[#EADBC8] bg-white p-5 sm:p-7">
          <h1 className="font-display text-2xl font-semibold">Acompanhe seus pedidos</h1>
          <p className="mt-1 text-sm text-[#7A6658]">Informe o número de WhatsApp usado na compra.</p>

          <form onSubmit={handleSubmit} className="mt-5 flex gap-3">
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              className="min-w-0 flex-1 rounded-xl border border-[#D9C7B5] px-4 py-2.5 text-sm outline-none focus:border-[#7A6658]"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#291D16] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-xl border border-[#F3C4C4] bg-[#FDF2F2] px-4 py-3 text-sm text-[#B42318]">{error}</p>
          )}
        </section>

        {pedidos && pedidos.length === 0 && (
          <p className="text-center text-sm text-[#7A6658]">Nenhum pedido encontrado para este número.</p>
        )}

        {pedidos && pedidos.map((pedido) => <PedidoCard key={pedido.id} pedido={pedido} slug={slug} />)}

        {existeAtivo && (
          <p className="text-center text-xs text-[#7A6658]">Atualizado automaticamente a cada 30 segundos.</p>
        )}
      </main>
    </div>
  );
}
