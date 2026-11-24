import {
  AtualizarStatusPedidoRequest,
  AuthSession,
  CreatePublicOrderPayload,
  DashboardData,
  CriarPedidoRequest,
  Order,
  OrderStatus,
  Pedido,
  PedidoStatus,
  Product,
  PublicMenuResponse,
  StoreConfig,
} from '../types';
import { broadcastNewOrder } from '../utils/kitchenNotifications';

const STORAGE_KEYS = {
  TOKEN: 'pudimflow_token',
  SESSION: 'pudimflow_session',
} as const;

export const API_BASE_URL: string = import.meta.env.VITE_API_URL || '/api';

export function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(STORAGE_KEYS.TOKEN, session.token);
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

interface RequestOptions extends RequestInit {
  tenantSlug?: string;
  requiresAuth?: boolean;
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { tenantSlug, requiresAuth = false, headers = {}, ...rest } = options;
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Content-Type', 'application/json');

  if (requiresAuth) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      throw new Error('Faça login para continuar.');
    }
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  if (tenantSlug) {
    requestHeaders.set('X-Tenant-Id', tenantSlug);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: requestHeaders,
  });

  if (!response.ok) {
    if (response.status === 401 && requiresAuth) {
      clearSession();
      throw new Error('Sessão recusada ou expirada. Entre novamente.');
    }

    let message = `Erro na API (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData?.message) message = errorData.message;
    } catch {
      // Use the status-based message for non-JSON responses.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  async login(email: string, password: string): Promise<AuthSession> {
    const data = await apiRequest<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const session: AuthSession = {
      token: data.token,
      tenantId: '',
      nome: '',
      email,
    };
    saveSession(session);
    return session;
  },

  async register(email: string, password: string, storeName: string): Promise<AuthSession> {
    const data = await apiRequest<{ token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, storeName }),
    });

    const session: AuthSession = {
      token: data.token,
      tenantId: '',
      nome: '',
      email,
    };
    saveSession(session);
    return session;
  },

  getOrders(): Promise<Order[]> {
    return apiRequest<Order[]>('/admin/pedidos', { requiresAuth: true });
  },

  updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return apiRequest<Order>(`/admin/pedidos/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify({ status }),
    });
  },

  subscribeOrdersStream(
    onNewOrder: (order: Order) => void,
    onConnectionChange: (connected: boolean) => void
  ): () => void {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (!token) {
      onConnectionChange(false);
      return () => onConnectionChange(false);
    }

    const streamUrl = `${API_BASE_URL}/pedidos/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => onConnectionChange(true);
    eventSource.onerror = () => onConnectionChange(false);
    eventSource.onmessage = (event) => {
      try {
        const order = JSON.parse(event.data) as Order;
        broadcastNewOrder(order);
        onNewOrder(order);
      } catch {
        // Ignore non-order events such as stream heartbeats.
      }
    };

    return () => {
      eventSource.close();
      onConnectionChange(false);
    };
  },

  getProducts(): Promise<Product[]> {
    return apiRequest<Product[]>('/admin/produtos', { requiresAuth: true });
  },

  saveProduct(productInput: Omit<Product, 'id'> & { id?: string }): Promise<Product> {
    if (productInput.id) {
      return apiRequest<Product>(`/admin/produtos/${encodeURIComponent(productInput.id)}`, {
        method: 'PUT',
        requiresAuth: true,
        body: JSON.stringify(productInput),
      });
    }

    return apiRequest<Product>('/admin/produtos', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(productInput),
    });
  },

  toggleProductActive(productId: string, ativo: boolean): Promise<Product> {
    return apiRequest<Product>(`/admin/produtos/${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify({ ativo }),
    });
  },

  adjustProductStock(productId: string, delta: number): Promise<Product> {
    return apiRequest<Product>(
      `/admin/produtos/${encodeURIComponent(productId)}/estoque`,
      {
        method: 'PATCH',
        requiresAuth: true,
        body: JSON.stringify({ delta }),
      }
    );
  },

  deleteProduct(productId: string): Promise<void> {
    return apiRequest<void>(`/admin/produtos/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      requiresAuth: true,
    });
  },

  getStoreConfig(): Promise<StoreConfig> {
    return apiRequest<StoreConfig>('/admin/configuracoes', { requiresAuth: true });
  },

  updateStoreConfig(config: StoreConfig): Promise<StoreConfig> {
    return apiRequest<StoreConfig>('/admin/configuracoes', {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(config),
    });
  },

  getPublicMenu(slug: string): Promise<PublicMenuResponse> {
    return apiRequest<PublicMenuResponse>(
      `/loja/${encodeURIComponent(slug)}/cardapio`,
      { tenantSlug: slug }
    );
  },

  async createPublicOrder(
    slug: string,
    payload: CreatePublicOrderPayload
  ): Promise<Order> {
    const order = await apiRequest<Order>(
      `/loja/${encodeURIComponent(slug)}/pedidos`,
      {
        method: 'POST',
        tenantSlug: slug,
        body: JSON.stringify(payload),
      }
    );
    broadcastNewOrder(order);
    return order;
  },

  listarPedidos(status?: PedidoStatus, pageSize = 100): Promise<Pedido[]> {
    const params = new URLSearchParams({ pageSize: String(pageSize) });
    if (status) params.set('status', status);
    return apiRequest<Pedido[]>(`/admin/pedidos?${params.toString()}`, { requiresAuth: true });
  },

  buscarPedido(id: number): Promise<Pedido> {
    return apiRequest<Pedido>(`/admin/pedidos/${id}`, { requiresAuth: true });
  },

  atualizarStatusPedido(id: number, payload: AtualizarStatusPedidoRequest): Promise<Pedido> {
    return apiRequest<Pedido>(`/admin/pedidos/${id}/status`, {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify(payload),
    });
  },

  buscarDashboard(): Promise<DashboardData> {
    return apiRequest<DashboardData>('/admin/dashboard', { requiresAuth: true });
  },

  listarPedidosPublicos(slug: string, whatsapp: string): Promise<Pedido[]> {
    const params = new URLSearchParams({ whatsapp });
    return apiRequest<Pedido[]>(`/loja/${encodeURIComponent(slug)}/pedidos?${params.toString()}`, {
      tenantSlug: slug,
    });
  },

  criarPedidoPublico(slug: string, payload: CriarPedidoRequest): Promise<Pedido> {
    return apiRequest<Pedido>(`/loja/${encodeURIComponent(slug)}/pedidos`, {
      method: 'POST',
      tenantSlug: slug,
      body: JSON.stringify(payload),
    });
  },
};
