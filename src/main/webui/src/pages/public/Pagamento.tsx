import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, CreditCard, LoaderCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Pedido } from '../../types';
import { formatCurrency } from '../../utils/format';

function formatDateTime(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function PagamentoPage() {
  const { slug = '', codigo = '' } = useParams();
  const [searchParams] = useSearchParams();
  const whatsapp = searchParams.get('whatsapp') ?? '';

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gerandoLink, setGerandoLink] = useState(false);
  const [erroPagamento, setErroPagamento] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pedidos = await api.listarPedidosPublicos(slug, whatsapp);
      const encontrado = pedidos.find((item) => item.codigo === codigo) ?? null;
      if (!encontrado) {
        setError('Pedido não encontrado. Verifique o código e o WhatsApp informados.');
      }
      setPedido(encontrado);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar o pedido.');
    } finally {
      setLoading(false);
    }
  }, [slug, codigo, whatsapp]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const gerarPagamento = async () => {
    if (!pedido) return;
    setGerandoLink(true);
    setErroPagamento(null);
    try {
      const atualizado = await api.gerarPagamentoPublico(slug, pedido.codigo, pedido.clienteWhatsapp);
      if (atualizado.pagamentoUrl) {
        window.location.href = atualizado.pagamentoUrl;
        return;
      }
      setErroPagamento('Não foi possível gerar o link de pagamento.');
    } catch (payErr) {
      setErroPagamento(payErr instanceof Error ? payErr.message : 'Não foi possível gerar o link de pagamento.');
    } finally {
      setGerandoLink(false);
    }
  };

  const pagamentoPago = pedido?.pagamentoStatus === 'PAGO';
  const pagamentoPendente = pedido?.pagamentoStatus === 'AGUARDANDO';

  return (
    <div className="min-h-screen bg-[#FAF7F2] px-5 py-10 text-[#291D16]">
      <main className="mx-auto max-w-xl">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-20 text-[#7A6658]">
            <LoaderCircle className="h-5 w-5 animate-spin" /> Carregando pedido...
          </div>
        )}

        {!loading && error && (
          <section className="rounded-2xl border border-[#F5C2C0] bg-[#FFF5F5] p-6 text-center">
            <p className="text-sm text-[#B42318]">{error}</p>
            <a href={`/${slug}`} className="mt-4 inline-block text-sm font-semibold text-[#B45309] underline">
              Voltar ao cardápio
            </a>
          </section>
        )}

        {!loading && pedido && (
          <section className="rounded-2xl border border-[#EADBC8] bg-white p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B45309]">Pagamento</p>
            <h1 className="mt-2 font-display text-2xl font-semibold">Pedido {pedido.codigo}</h1>
            <p className="mt-1 text-sm text-[#7A6658]">
              Criado em {formatDateTime(pedido.criadoEm)} · {pedido.clienteNome}
            </p>

            <div className="mt-6 rounded-xl bg-[#FAF7F2] p-4">
              {pagamentoPago && (
                <p className="flex items-center gap-2 font-semibold text-[#16834A]">
                  <CheckCircle2 className="h-5 w-5" /> Pagamento confirmado
                  {pedido.pagoEm && <span className="text-sm font-normal text-[#4B5D52]">em {formatDateTime(pedido.pagoEm)}</span>}
                </p>
              )}
              {pagamentoPendente && (
                <p className="flex items-center gap-2 font-semibold text-[#B45309]">
                  <Clock className="h-5 w-5" /> Pagamento pendente
                </p>
              )}
              {!pagamentoPago && !pagamentoPendente && (
                <p className="font-semibold text-[#4B5D52]">Pagamento na {pedido.tipoEntrega === 'ENTREGA' ? 'entrega' : 'retirada'}</p>
              )}
              <p className="mt-1 text-sm text-[#4B5D52]">Status do pedido: {pedido.status.replace(/_/g, ' ').toLowerCase()}</p>
            </div>

            <ul className="mt-6 divide-y divide-[#EFE6DA] text-sm">
              {pedido.itens.map((item, index) => (
                <li key={`${item.produtoId}-${index}`} className="flex justify-between py-2">
                  <span>
                    {item.quantidade}x {item.produtoNome}
                  </span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-[#EADBC8] pt-3 font-semibold">
              <span>Total</span>
              <span>{formatCurrency(pedido.valorTotal)}</span>
            </div>

            {pagamentoPendente && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => void gerarPagamento()}
                  disabled={gerandoLink}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#B45309] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#92400E] disabled:opacity-60"
                >
                  {gerandoLink ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Pagar agora
                </button>
                {erroPagamento && <p className="mt-2 text-center text-sm text-[#B42318]">{erroPagamento}</p>}
              </div>
            )}

            <a
              href={`/${slug}/pedido?whatsapp=${encodeURIComponent(pedido.clienteWhatsapp)}`}
              className="mt-6 block text-center text-sm font-semibold text-[#B45309] underline"
            >
              Acompanhar pedido
            </a>
          </section>
        )}
      </main>
    </div>
  );
}
