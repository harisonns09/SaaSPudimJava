import {
  AtualizarStatusPedidoRequest,
  AuthSession,
  CreateStoreRequest,
  DashboardData,
  CriarPedidoRequest,
  Pedido,
  PedidoStatus,
  Product,
  PublicMenuResponse,
  StoreAccessResponse,
  StoreConfig,
  StoreConfigUpdate,
} from '../types';

const STORAGE_KEYS = {
  TOKEN: 'pudimflow_token',
  SESSION: 'pudimflow_session',
  // Sessão original do superadmin, guardada enquanto ele acessa uma loja como suporte.
  SUPERADMIN_SESSION: 'pudimflow_superadmin_session',
} as const;

const SUPERADMIN_ROLE = 'superadmin';

export function decodeTokenGroups(token: string): string[] {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const claims = JSON.parse(atob(padded)) as { groups?: string[] };
    return Array.isArray(claims.groups) ? claims.groups : [];
  } catch {
    return [];
  }
}

export function isSuperAdminToken(token: string | null | undefined): boolean {
  return !!token && decodeTokenGroups(token).includes(SUPERADMIN_ROLE);
}

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
  localStorage.removeItem(STORAGE_KEYS.SUPERADMIN_SESSION);
}

export function isImpersonating(): boolean {
  return localStorage.getItem(STORAGE_KEYS.SUPERADMIN_SESSION) !== null;
}

function restoreSuperadminSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEYS.SUPERADMIN_SESSION);
  localStorage.removeItem(STORAGE_KEYS.SUPERADMIN_SESSION);
  if (!raw) return null;
  const original = JSON.parse(raw) as AuthSession;
  saveSession(original);
  return original;
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

  async register(email: string, password: string, storeName: string, aceiteTermos: boolean): Promise<AuthSession> {
    const data = await apiRequest<{ token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, storeName, aceiteTermos }),
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

  listarLojas(): Promise<StoreConfig[]> {
    return apiRequest<StoreConfig[]>('/superadmin/lojas', { requiresAuth: true });
  },

  criarLoja(payload: CreateStoreRequest): Promise<StoreConfig> {
    return apiRequest<StoreConfig>('/superadmin/lojas', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(payload),
    });
  },

  buscarLoja(tenantId: string): Promise<StoreConfig> {
    return apiRequest<StoreConfig>(`/superadmin/lojas/${encodeURIComponent(tenantId)}`, {
      requiresAuth: true,
    });
  },

  atualizarLoja(tenantId: string, config: StoreConfigUpdate): Promise<StoreConfig> {
    return apiRequest<StoreConfig>(`/superadmin/lojas/${encodeURIComponent(tenantId)}`, {
      method: 'PUT',
      requiresAuth: true,
      body: JSON.stringify(config),
    });
  },

  alterarStatusLoja(tenantId: string, ativa: boolean): Promise<StoreConfig> {
    return apiRequest<StoreConfig>(`/superadmin/lojas/${encodeURIComponent(tenantId)}/status`, {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify({ ativa }),
    });
  },

  /**
   * Entra na loja como suporte. Guarda a sessão do superadmin para restaurá-la depois
   * com encerrarSuporte().
   */
  async iniciarSuporte(tenantId: string): Promise<AuthSession> {
    const current = getStoredSession();
    const access = await apiRequest<StoreAccessResponse>(
      `/superadmin/lojas/${encodeURIComponent(tenantId)}/acessar`,
      { method: 'POST', requiresAuth: true },
    );

    if (current && !isImpersonating()) {
      localStorage.setItem(STORAGE_KEYS.SUPERADMIN_SESSION, JSON.stringify(current));
    }

    const session: AuthSession = {
      token: access.token,
      tenantId,
      nome: access.nomeLoja,
      email: current?.email ?? '',
    };
    saveSession(session);
    return session;
  },

  encerrarSuporte(): AuthSession | null {
    return restoreSuperadminSession();
  },

  getStoreConfig(): Promise<StoreConfig> {
    return apiRequest<StoreConfig>('/admin/configuracoes', { requiresAuth: true });
  },

  updateStoreConfig(config: StoreConfigUpdate): Promise<StoreConfig> {
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

  gerarPagamentoPublico(slug: string, codigo: string, whatsapp: string): Promise<Pedido> {
    return apiRequest<Pedido>(
      `/loja/${encodeURIComponent(slug)}/pedidos/${encodeURIComponent(codigo)}/pagamento?whatsapp=${encodeURIComponent(whatsapp)}`,
      {
        method: 'POST',
        tenantSlug: slug,
      }
    );
  },
};
