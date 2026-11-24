# 🧪 Exemplos de Uso - Sistema de Pedidos

## Setup Inicial

Certifique-se que a aplicação está rodando:
```bash
./mvnw quarkus:dev
```

---

## 1️⃣ Criar Pedido (Público - SEM autenticação)

### Request
```bash
curl -X POST http://localhost:8080/api/loja/minha-loja/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "clienteNome": "João Silva",
    "clienteWhatsapp": "+55 11 99999-9999",
    "clienteEmail": "joao@example.com",
    "tipoEntrega": "entrega",
    "endereco": "Rua das Flores, 123, Apto 456",
    "observacoes": "Sem açúcar extra",
    "itens": [
      {"produtoId": 1, "quantidade": 2},
      {"produtoId": 3, "quantidade": 1}
    ]
  }'
```

### Response
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

## 2️⃣ Listar Pedidos (Admin - COM autenticação)

### Listar todos os pedidos
```bash
curl -X GET "http://localhost:8080/api/admin/pedidos" \
  -H "Authorization: Bearer <seu_jwt_token>"
```

### Listar apenas pendentes
```bash
curl -X GET "http://localhost:8080/api/admin/pedidos?status=PENDENTE" \
  -H "Authorization: Bearer <seu_jwt_token>"
```

### Buscar por cliente
```bash
curl -X GET "http://localhost:8080/api/admin/pedidos?cliente=João" \
  -H "Authorization: Bearer <seu_jwt_token>"
```

### Com paginação
```bash
curl -X GET "http://localhost:8080/api/admin/pedidos?page=0&pageSize=10" \
  -H "Authorization: Bearer <seu_jwt_token>"
```

### Response
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
    "atualizadoEm": "2023-11-25T14:30:00",
    "itens": [...]
  }
]
```

**Headers adicionais na resposta:**
- `X-Total-Count: 42` - Total de pedidos
- `X-Page: 0` - Página atual
- `X-Page-Size: 10` - Itens por página

---

## 3️⃣ Obter Detalhes do Pedido

```bash
curl -X GET "http://localhost:8080/api/admin/pedidos/1" \
  -H "Authorization: Bearer <seu_jwt_token>"
```

---

## 4️⃣ Atualizar Status

### Passar de PENDENTE para EM_PREPARO
```bash
curl -X PATCH "http://localhost:8080/api/admin/pedidos/1/status" \
  -H "Authorization: Bearer <seu_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "novoStatus": "EM_PREPARO",
    "observacoes": "Iniciando preparo do pudim de chocolate"
  }'
```

### Passar de EM_PREPARO para PRONTO_PARA_ENTREGA
```bash
curl -X PATCH "http://localhost:8080/api/admin/pedidos/1/status" \
  -H "Authorization: Bearer <seu_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "novoStatus": "PRONTO_PARA_ENTREGA",
    "observacoes": "Pronto para entrega"
  }'
```

### Passar de PRONTO_PARA_ENTREGA para SAIU_PARA_ENTREGA
```bash
curl -X PATCH "http://localhost:8080/api/admin/pedidos/1/status" \
  -H "Authorization: Bearer <seu_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "novoStatus": "SAIU_PARA_ENTREGA",
    "observacoes": "Saiu para entrega com João (motoboy)"
  }'
```

### Passar de SAIU_PARA_ENTREGA para ENTREGUE
```bash
curl -X PATCH "http://localhost:8080/api/admin/pedidos/1/status" \
  -H "Authorization: Bearer <seu_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "novoStatus": "ENTREGUE",
    "observacoes": "Entregue com sucesso"
  }'
```

---

## 5️⃣ Cancelar Pedido

### Sem motivo
```bash
curl -X DELETE "http://localhost:8080/api/admin/pedidos/1" \
  -H "Authorization: Bearer <seu_jwt_token>"
```

### Com motivo
```bash
curl -X DELETE "http://localhost:8080/api/admin/pedidos/1?motivo=Cliente+solicitou+cancelamento" \
  -H "Authorization: Bearer <seu_jwt_token>"
```

**Response:** `204 No Content`

---

## 6️⃣ Obter Histórico de Status

```bash
curl -X GET "http://localhost:8080/api/admin/pedidos/1/historico" \
  -H "Authorization: Bearer <seu_jwt_token>"
```

### Response
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
    "observacoes": "Iniciando preparo do pudim de chocolate"
  },
  {
    "id": 3,
    "orderId": 1,
    "statusAnterior": "EM_PREPARO",
    "statusNovo": "PRONTO_PARA_ENTREGA",
    "alteradoEm": "2023-11-25T14:45:00",
    "observacoes": "Pronto para entrega"
  }
]
```

---

## ❌ Exemplos de Erro

### 1. Produto não encontrado
```bash
curl -X POST http://localhost:8080/api/loja/minha-loja/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "clienteNome": "Maria",
    "itens": [{"produtoId": 999, "quantidade": 1}]
  }'
```

**Response:** `422 Unprocessable Entity`
```json
{
  "error": "Produto ID 999 não encontrado"
}
```

### 2. Estoque insuficiente
```bash
curl -X POST http://localhost:8080/api/loja/minha-loja/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "clienteNome": "Maria",
    "itens": [{"produtoId": 1, "quantidade": 1000}]
  }'
```

**Response:** `422 Unprocessable Entity`
```json
{
  "error": "Estoque insuficiente para 'Pudim de Chocolate'. Disponível: 50, Solicitado: 1000"
}
```

### 3. Transição de estado inválida
```bash
curl -X PATCH "http://localhost:8080/api/admin/pedidos/1/status" \
  -H "Authorization: Bearer <seu_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "novoStatus": "PENDENTE"
  }'
```

**Response:** `422 Unprocessable Entity`
```json
{
  "error": "Não é permitido mudar de ENTREGUE para PENDENTE"
}
```

### 4. Pedido não encontrado
```bash
curl -X GET "http://localhost:8080/api/admin/pedidos/999" \
  -H "Authorization: Bearer <seu_jwt_token>"
```

**Response:** `404 Not Found`
```json
{
  "error": "Pedido não encontrado"
}
```

### 5. Sem autenticação
```bash
curl -X GET "http://localhost:8080/api/admin/pedidos"
```

**Response:** `401 Unauthorized`

---

## 🔄 Fluxo Completo de um Pedido

```bash
# 1. Cliente cria pedido (público)
RESPONSE1=$(curl -s -X POST http://localhost:8080/api/loja/minha-loja/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "clienteNome": "Pedro",
    "clienteWhatsapp": "+55 11 98888-8888",
    "tipoEntrega": "entrega",
    "endereco": "Av Paulista, 1000",
    "itens": [{"produtoId": 1, "quantidade": 1}]
  }')

echo "Pedido criado:"
echo $RESPONSE1
PEDIDO_ID=$(echo $RESPONSE1 | jq '.id')

# 2. Admin aceita pedido
curl -X PATCH "http://localhost:8080/api/admin/pedidos/$PEDIDO_ID/status" \
  -H "Authorization: Bearer <seu_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"novoStatus": "EM_PREPARO"}'

# 3. Admin marca como pronto
curl -X PATCH "http://localhost:8080/api/admin/pedidos/$PEDIDO_ID/status" \
  -H "Authorization: Bearer <seu_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"novoStatus": "PRONTO_PARA_ENTREGA"}'

# 4. Admin marca saída para entrega
curl -X PATCH "http://localhost:8080/api/admin/pedidos/$PEDIDO_ID/status" \
  -H "Authorization: Bearer <seu_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"novoStatus": "SAIU_PARA_ENTREGA", "observacoes": "Com Uber"}'

# 5. Admin confirma entrega
curl -X PATCH "http://localhost:8080/api/admin/pedidos/$PEDIDO_ID/status" \
  -H "Authorization: Bearer <seu_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"novoStatus": "ENTREGUE"}'

# 6. Ver histórico completo
curl -X GET "http://localhost:8080/api/admin/pedidos/$PEDIDO_ID/historico" \
  -H "Authorization: Bearer <seu_jwt_token>"
```

---

## 🛠️ Notas Importantes

1. **JWT Token** - Substituir `<seu_jwt_token>` com um token válido
2. **Slug da Loja** - Usar `minha-loja` conforme sua configuração
3. **Produto ID** - Usar IDs de produtos que existem no banco
4. **Multi-tenancy** - Cada admin só vê pedidos de sua loja
5. **Timestamps** - Formato ISO 8601 (UTC)

---

## 📱 Próximos Passos para Cliente

- [ ] Criar API pública para rastrear pedido por código
- [ ] Enviar SMS/WhatsApp quando status muda
- [ ] Dashboard web em tempo real
- [ ] Integração com app móvel
