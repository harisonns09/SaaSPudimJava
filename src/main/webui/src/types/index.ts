export enum DeliveryType {
  ENTREGA = 'ENTREGA',
  RETIRADA = 'RETIRADA',
}

export interface AuthSession {
  token: string;
  tenantId: string;
  nome: string;
  email: string;
}

export interface Product {
  id: string;
  nome: string;
  descricao: string;
  pesoGramas: number;
  precoVenda: number;
  custoEstimado: number;
  estoqueAtual: number;
  ativo: boolean;
  imagemUrl: string;
  destaque?: string;
}

export interface AiTokenUsage {
  tokensUsados: number;
  limiteMensal: number;
  plano: string;
  atendimentosMes: number;
  conversaoPercentual: number;
  cicloRenovacao: string;
}

export interface StoreConfigUpdate {
  nomeLoja: string;
  subtitulo?: string | null;
  taxaEntregaPadrao?: number | null;
  abertaParaEncomendas: boolean;
  infinitepayHandle?: string | null;
}

export interface CreateStoreRequest {
  nomeLoja: string;
  adminEmail: string;
  adminPassword: string;
}

export interface StoreStatusUpdate {
  ativa: boolean;
}

export interface StoreAccessResponse {
  token: string;
  nomeLoja: string;
}

export interface StoreConfig {
  tenantId: string;
  ativa?: boolean;
  nomeLoja: string;
  slug: string;
  subtitulo: string;
  taxaEntregaPadrao: number;
  whatsappId: string;
  whatsappConectado: boolean;
  abertaParaEncomendas: boolean;
  infinitepayHandle?: string | null;
  tempoPreparoMedio: string;
  enderecoRetirada: string;
  tomDeVozIa: string;
  bannerUrl: string;
  consumoIa: AiTokenUsage;
}

export interface PublicMenuResponse {
  loja: Pick<
    StoreConfig,
    | 'nomeLoja'
    | 'slug'
    | 'subtitulo'
    | 'taxaEntregaPadrao'
    | 'abertaParaEncomendas'
    | 'tempoPreparoMedio'
    | 'enderecoRetirada'
    | 'bannerUrl'
    | 'whatsappId'
  >;
  produtos: Product[];
}

// Contrato atual da API de pedidos (espelha OrderResponse / CreateOrderRequest / UpdateOrderStatusRequest do Quarkus).
export type PedidoStatus =
  | 'PENDENTE'
  | 'EM_PREPARO'
  | 'PRONTO_PARA_ENTREGA'
  | 'ENTREGUE'
  | 'CANCELADO';

export interface PedidoItem {
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  preco: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  codigo: string;
  clienteNome: string;
  clienteWhatsapp: string;
  clienteEmail?: string | null;
  status: PedidoStatus;
  itens: PedidoItem[];
  valorTotal: number;
  tipoEntrega: DeliveryType;
  endereco?: string | null;
  observacoes?: string | null;
  criadoEm: string;
  atualizadoEm?: string | null;
  pagamentoStatus?: 'NAO_APLICA' | 'AGUARDANDO' | 'PAGO' | null;
  pagamentoUrl?: string | null;
  pagamentoValorPago?: number | null;
  pagoEm?: string | null;
}

export interface CriarPedidoItemRequest {
  produtoId: number;
  quantidade: number;
}

export interface CriarPedidoRequest {
  clienteNome: string;
  clienteWhatsapp: string;
  clienteEmail?: string;
  tipoEntrega: DeliveryType;
  endereco?: string;
  observacoes?: string;
  aceiteTermos: boolean;
  itens: CriarPedidoItemRequest[];
}

export interface AtualizarStatusPedidoRequest {
  novoStatus: PedidoStatus;
  observacoes?: string;
}

// Espelha DashboardResponse do Quarkus (GET /api/admin/dashboard).
export interface DashboardTopProduto {
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  faturamento: number;
}

export interface DashboardPedidoResumo {
  id: number;
  codigo: string;
  clienteNome: string;
  status: PedidoStatus;
  valorTotal: number;
  criadoEm: string;
}

export interface DashboardData {
  totalPedidos: number;
  pedidosHoje: number;
  pedidosAtivos: number;
  faturamentoTotal: number;
  faturamentoHoje: number;
  ticketMedio: number;
  pedidosPorStatus: Record<PedidoStatus, number>;
  topProdutos: DashboardTopProduto[];
  pedidosRecentes: DashboardPedidoResumo[];
}
