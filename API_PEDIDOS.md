# API de Pedidos - Documentação

## Endpoints Públicos (Sem Autenticação)

### 1. Criar Pedido
**POST** `/api/loja/{slug}/pedidos`

Cria um novo pedido para uma loja pública.

**Request:**
```json
{
  "clienteNome": "João Silva",
  "clienteWhatsapp": "+55 11 99999-9999",
  "clienteEmail": "joao@example.com",
  "tipoEntrega": "entrega",
  "endereco": "Rua das Flores, 123, Apto 456",
  "observacoes": "Sem açúcar extra",
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 2
    },
    {
      "produtoId": 3,
      "quantidade": 1
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "codigo": "PD-20231125-000001",
  "clienteNome": "João Silva",
  "clienteWhatsapp": "+55 11 99999-9999",
  "clienteEmail": "joao@example.com",
  "status": "PENDENTE",
  "tipoEntrega": "entrega",
  "endereco": "Rua das Flores, 123, Apto 456",
  "observacoes": "Sem açúcar extra",
  "valorTotal": 45.50,
  "criadoEm": "2023-11-25T14:30:00",
  "atualizadoEm": "2023-11-25T14:30:00",
  "itens": [
    {
      "produtoId": 1,
      "produtoNome": "Pudim de Chocolate",
      "quantidade": 2,
      "preco": 15.00,
      "subtotal": 30.00
    },
    {
      "produtoId": 3,
      "produtoNome": "Pudim de Coco",
      "quantidade": 1,
      "preco": 15.50,
      "subtotal": 15.50
    }
  ]
}
```

---

## Endpoints Admin (Requer Autenticação JWT)

### 2. Listar Pedidos
**GET** `/api/admin/pedidos`

Lista todos os pedidos da loja com paginação e filtros.

**Query Parameters:**
- `status` (opcional): Filtrar por status (PENDENTE, EM_PREPARO, PRONTO_PARA_ENTREGA, SAIU_PARA_ENTREGA, ENTREGUE, CANCELADO)
- `cliente` (opcional): Filtrar por nome do cliente (parcial, case-insensitive)
- `page` (opcional, padrão: 0): Número da página
- `pageSize` (opcional, padrão: 20): Itens por página

**Examples:**
```bash
GET /api/admin/pedidos
GET /api/admin/pedidos?status=PENDENTE
GET /api/admin/pedidos?cliente=João&page=0&pageSize=10
GET /api/admin/pedidos?status=EM_PREPARO&page=1
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "codigo": "PD-20231125-000001",
    "clienteNome": "João Silva",
    "clienteWhatsapp": "+55 11 99999-9999",
    "clienteEmail": "joao@example.com",
    "status": "PENDENTE",
    "valorTotal": 45.50,
    "criadoEm": "2023-11-25T14:30:00",
    ...
  }
]
```

**Headers de resposta:**
- `X-Total-Count`: Total de pedidos (considerando filtros)
- `X-Page`: Página atual
- `X-Page-Size`: Itens por página

---

### 3. Obter Detalhes do Pedido
**GET** `/api/admin/pedidos/{id}`

Obtém detalhes completos de um pedido específico.

**Response:** `200 OK`
```json
{
  "id": 1,
  "codigo": "PD-20231125-000001",
  "clienteNome": "João Silva",
  "clienteWhatsapp": "+55 11 99999-9999",
  "clienteEmail": "joao@example.com",
  "status": "PENDENTE",
  "tipoEntrega": "entrega",
  "endereco": "Rua das Flores, 123, Apto 456",
  "observacoes": "Sem açúcar extra",
  "valorTotal": 45.50,
  "criadoEm": "2023-11-25T14:30:00",
  "atualizadoEm": "2023-11-25T14:30:00",
  "itens": [...]
}
```

---

### 4. Atualizar Status do Pedido
**PATCH** `/api/admin/pedidos/{id}/status`

Atualiza o status de um pedido com validação de transição de estado.

**Transições de estado permitidas:**
- PENDENTE → EM_PREPARO, CANCELADO
- EM_PREPARO → PRONTO_PARA_ENTREGA, CANCELADO
- PRONTO_PARA_ENTREGA → SAIU_PARA_ENTREGA, CANCELADO
- SAIU_PARA_ENTREGA → ENTREGUE, CANCELADO
- ENTREGUE → (nenhuma)
- CANCELADO → (nenhuma)

**Request:**
```json
{
  "novoStatus": "EM_PREPARO",
  "observacoes": "Iniciando preparo do pedido"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "codigo": "PD-20231125-000001",
  "status": "EM_PREPARO",
  "atualizadoEm": "2023-11-25T14:35:00",
  ...
}
```

---

### 5. Cancelar Pedido
**DELETE** `/api/admin/pedidos/{id}`

Cancela um pedido com motivo opcional.

**Query Parameters:**
- `motivo` (opcional): Motivo do cancelamento

**Examples:**
```bash
DELETE /api/admin/pedidos/1
DELETE /api/admin/pedidos/1?motivo=Cliente+solicitou+cancelamento
```

**Response:** `204 No Content`

---

### 6. Obter Histórico de Status
**GET** `/api/admin/pedidos/{id}/historico`

Obtém o histórico completo de mudanças de status de um pedido.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "orderId": 1,
    "statusAnterior": null,
    "statusNovo": "PENDENTE",
    "alteradoEm": "2023-11-25T14:30:00",
    "observacoes": "Pedido criado"
  },
  {
    "id": 2,
    "orderId": 1,
    "statusAnterior": "PENDENTE",
    "statusNovo": "EM_PREPARO",
    "alteradoEm": "2023-11-25T14:35:00",
    "observacoes": "Iniciando preparo do pedido"
  }
]
```

---

## Status do Pedido (OrderStatus)

| Status | Descrição |
|--------|-----------|
| `PENDENTE` | Pedido recém criado, aguardando aceitar |
| `EM_PREPARO` | Pedido está sendo preparado |
| `PRONTO_PARA_ENTREGA` | Pedido pronto, aguardando retirada/entrega |
| `SAIU_PARA_ENTREGA` | Pedido está a caminho do cliente |
| `ENTREGUE` | Pedido entregue com sucesso |
| `CANCELADO` | Pedido cancelado |

---

## Erros Comuns

### 400 Bad Request
```json
{
  "error": "Pedido deve ter pelo menos um item"
}
```

### 404 Not Found
```json
{
  "error": "Pedido não encontrado"
}
```

### 422 Unprocessable Entity (Validação)
```json
{
  "error": "Estoque insuficiente para 'Pudim de Chocolate'. Disponível: 5, Solicitado: 10"
}
```

### 422 Transição de Status Inválida
```json
{
  "error": "Não é permitido mudar de ENTREGUE para PENDENTE"
}
```

---

## Exemplos cURL

### Criar pedido (público)
```bash
curl -X POST http://localhost:8080/api/loja/minha-loja/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "clienteNome": "João Silva",
    "clienteWhatsapp": "+55 11 99999-9999",
    "itens": [
      {"produtoId": 1, "quantidade": 2}
    ]
  }'
```

### Listar pedidos pendentes (admin)
```bash
curl -X GET "http://localhost:8080/api/admin/pedidos?status=PENDENTE" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Atualizar status (admin)
```bash
curl -X PATCH http://localhost:8080/api/admin/pedidos/1/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "novoStatus": "EM_PREPARO",
    "observacoes": "Iniciando preparo"
  }'
```

### Cancelar pedido (admin)
```bash
curl -X DELETE "http://localhost:8080/api/admin/pedidos/1?motivo=Falta+de+estoque" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Formato de Data/Hora

Todos as datas/horas usam o formato ISO 8601:
```
2023-11-25T14:30:00
```

---

## Autenticação

Os endpoints `/api/admin/pedidos/**` requerem um JWT token no header `Authorization`:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

O token deve conter o claim `tenant_id` para multi-tenancy.
