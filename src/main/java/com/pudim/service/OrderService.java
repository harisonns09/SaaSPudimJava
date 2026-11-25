package com.pudim.service;

import com.pudim.exception.ResourceNotFoundException;
import com.pudim.exception.ValidationException;
import com.pudim.model.*;
import com.pudim.multitenancy.TenantContext;
import com.pudim.repository.OrderRepository;
import com.pudim.repository.OrderStatusHistoryRepository;
import com.pudim.repository.ProductRepository;
import com.pudim.repository.StoreConfigRepository;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class OrderService {

    public static final String PAGAMENTO_NAO_APLICA = "NAO_APLICA";
    public static final String PAGAMENTO_AGUARDANDO = "AGUARDANDO";
    public static final String PAGAMENTO_PAGO = "PAGO";

    @ConfigProperty(name = "app.public-url")
    String appPublicUrl;

    @Inject
    InfinitePayClient infinitePayClient;

    @Inject
    OrderRepository orderRepository;

    @Inject
    OrderStatusHistoryRepository statusHistoryRepository;

    @Inject
    ProductRepository productRepository;

    @Inject
    StoreConfigRepository storeConfigRepository;

    @Inject
    TenantContext tenantContext;

    @Transactional
    public OrderResponse createOrder(String tenantId, CreateOrderRequest request) {
        tenantContext.setTenantId(tenantId);

        if (request.itens == null || request.itens.isEmpty()) {
            throw new ValidationException("Pedido deve ter pelo menos um item");
        }

        List<OrderItem> ordenados = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemRequest item : request.itens) {
            Product product = productRepository.findByIdOptional(item.produtoId)
                    .orElseThrow(() -> new ValidationException("Produto ID " + item.produtoId + " não encontrado"));

            if (!product.ativo) {
                throw new ValidationException("Produto '" + product.nome + "' não está disponível");
            }

            if (product.estoqueAtual < item.quantidade) {
                throw new ValidationException("Estoque insuficiente para '" + product.nome + 
                        "'. Disponível: " + product.estoqueAtual + ", Solicitado: " + item.quantidade);
            }

            OrderItem orderItem = new OrderItem(
                    product.id,
                    product.nome,
                    item.quantidade,
                    product.precoVenda
            );
            ordenados.add(orderItem);
            total = total.add(orderItem.getSubtotal());

            product.estoqueAtual -= item.quantidade;
        }

        BigDecimal taxaEntrega = calcularTaxaEntrega(tenantId, request.tipoEntrega);
        total = total.add(taxaEntrega);

        Order order = new Order();
        order.tenantId = tenantId;
        order.codigo = gerarCodigoPedido();
        order.clienteNome = request.clienteNome;
        order.clienteWhatsapp = request.clienteWhatsapp;
        order.clienteEmail = request.clienteEmail;
        order.status = OrderStatus.PENDENTE;
        order.itens = ordenados;
        order.valorTotal = total;
        order.tipoEntrega = request.tipoEntrega;
        order.endereco = request.endereco;
        order.observacoes = request.observacoes;
        order.criadoEm = LocalDateTime.now();
        order.atualizadoEm = LocalDateTime.now();

        orderRepository.persist(order);

        statusHistoryRepository.persist(new OrderStatusHistory(
                tenantId,
                order.id,
                OrderStatus.PENDENTE,
                OrderStatus.PENDENTE,
                "Pedido criado"
        ));

        StoreConfig store = storeConfigRepository.findByTenantId(tenantId).orElse(null);
        if (store != null && store.infinitepayHandle != null && !store.infinitepayHandle.isBlank()) {
            order.pagamentoStatus = PAGAMENTO_AGUARDANDO;
            order.pagamentoUrl = criarCobrancaInfinitePay(store, order, ordenados);
        }

        return new OrderResponse(order, ordenados);
    }

    private String criarCobrancaInfinitePay(StoreConfig store, Order order, List<OrderItem> itens) {
        List<InfinitePayClient.ItemCobranca> cobrancas = new ArrayList<>();
        for (OrderItem item : itens) {
            cobrancas.add(new InfinitePayClient.ItemCobranca(item.quantidade, item.preco, item.produtoNome));
        }

        BigDecimal somaItens = itens.stream().map(OrderItem::getSubtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal taxaEntrega = order.valorTotal.subtract(somaItens);
        if (taxaEntrega.signum() > 0) {
            cobrancas.add(new InfinitePayClient.ItemCobranca(1, taxaEntrega, "Taxa de entrega"));
        }

        String whatsappCodificado = URLEncoder.encode(
                order.clienteWhatsapp == null ? "" : order.clienteWhatsapp, StandardCharsets.UTF_8);
        String redirectUrl = appPublicUrl + "/" + store.slug + "/pedido?whatsapp=" + whatsappCodificado;
        String webhookUrl = appPublicUrl + "/api/loja/" + store.slug + "/pagamentos/infinitepay/webhook";

        try {
            return infinitePayClient.criarLink(store.infinitepayHandle, order.codigo, cobrancas, redirectUrl, webhookUrl);
        } catch (IllegalStateException e) {
            throw new ValidationException("Não foi possível gerar o link de pagamento. Tente novamente.");
        }
    }

    @Transactional
    public void confirmarPagamentoInfinitePay(String tenantId, String orderNsu, String transactionNsu, String invoiceSlug) {
        tenantContext.setTenantId(tenantId);

        Order order = orderRepository.findByCodigo(orderNsu)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));
        validarTenantId(order.tenantId, tenantId);

        if (PAGAMENTO_PAGO.equals(order.pagamentoStatus)) {
            return;
        }

        StoreConfig store = storeConfigRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Loja não encontrada"));
        if (store.infinitepayHandle == null || store.infinitepayHandle.isBlank()) {
            throw new ValidationException("Loja sem handle InfinitePay configurado");
        }

        // O webhook não é assinado: a confirmação precisa vir da consulta à API.
        InfinitePayClient.PagamentoConsultado consulta = infinitePayClient.consultarPagamento(
                store.infinitepayHandle, orderNsu, transactionNsu, invoiceSlug);
        if (!consulta.pago()) {
            // Eventos como canceled/refunded/payment_failed não confirmam pagamento; não é erro.
            return;
        }

        order.pagamentoStatus = PAGAMENTO_PAGO;
        order.pagamentoTransactionNsu = transactionNsu;
        order.pagamentoInvoiceSlug = invoiceSlug;
        order.pagamentoValorPago = consulta.valorPago();
        order.pagoEm = LocalDateTime.now();

        statusHistoryRepository.persist(new OrderStatusHistory(
                tenantId,
                order.id,
                order.status,
                order.status,
                "Pagamento confirmado via InfinitePay"
        ));
    }

    @Transactional
    public OrderResponse updateOrderStatus(String tenantId, Long orderId, UpdateOrderStatusRequest request) {
        tenantContext.setTenantId(tenantId);

        Order order = orderRepository.findByIdOptional(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));

        validarTenantId(order.tenantId, tenantId);

        OrderStatus statusAnterior = order.status;

        if (!ehTransicaoValida(statusAnterior, request.novoStatus)) {
            throw new ValidationException("Não é permitido mudar de " + statusAnterior + 
                    " para " + request.novoStatus);
        }

        if (request.novoStatus == OrderStatus.CANCELADO) {
            restaurarEstoque(order);
        }

        order.status = request.novoStatus;
        order.atualizadoEm = LocalDateTime.now();

        orderRepository.persist(order);

        statusHistoryRepository.persist(new OrderStatusHistory(
                tenantId,
                orderId,
                statusAnterior,
                request.novoStatus,
                request.observacoes
        ));

        return toOrderResponse(order);
    }

    @Transactional
    public void cancelarPedido(String tenantId, Long orderId, String motivo) {
        tenantContext.setTenantId(tenantId);

        Order order = orderRepository.findByIdOptional(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));

        validarTenantId(order.tenantId, tenantId);

        if (order.status == OrderStatus.CANCELADO) {
            throw new ValidationException("Pedido já está cancelado");
        }

        if (order.status == OrderStatus.ENTREGUE) {
            throw new ValidationException("Não é permitido cancelar pedido já entregue");
        }

        OrderStatus statusAnterior = order.status;
        restaurarEstoque(order);
        order.status = OrderStatus.CANCELADO;
        order.atualizadoEm = LocalDateTime.now();

        orderRepository.persist(order);

        statusHistoryRepository.persist(new OrderStatusHistory(
                tenantId,
                orderId,
                statusAnterior,
                OrderStatus.CANCELADO,
                motivo != null ? "Cancelado: " + motivo : "Cancelado"
        ));
    }

    public OrderResponse getOrder(String tenantId, Long orderId) {
        tenantContext.setTenantId(tenantId);

        Order order = orderRepository.findByIdOptional(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));

        validarTenantId(order.tenantId, tenantId);

        return toOrderResponse(order);
    }

    public List<OrderResponse> listOrders(String tenantId, String statusFilter, String clienteFilter, int page, int pageSize) {
        tenantContext.setTenantId(tenantId);

        StringBuilder queryBuilder = new StringBuilder("tenantId = ?1");
        List<Object> params = new ArrayList<>();
        params.add(tenantId);

        if (statusFilter != null && !statusFilter.isEmpty()) {
            try {
                OrderStatus status = OrderStatus.valueOf(statusFilter.toUpperCase());
                queryBuilder.append(" AND status = ?").append(params.size() + 1);
                params.add(status);
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Status inválido: " + statusFilter);
            }
        }

        if (clienteFilter != null && !clienteFilter.isEmpty()) {
            queryBuilder.append(" AND clienteNome ILIKE ?").append(params.size() + 1);
            params.add("%" + clienteFilter + "%");
        }

        queryBuilder.append(" ORDER BY criadoEm DESC");

        PanacheQuery<Order> query = orderRepository.find(queryBuilder.toString(), params.toArray());

        return query.page(page, pageSize)
                .stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    public long countOrders(String tenantId, String statusFilter) {
        tenantContext.setTenantId(tenantId);

        StringBuilder queryBuilder = new StringBuilder("tenantId = ?1");
        List<Object> params = new ArrayList<>();
        params.add(tenantId);

        if (statusFilter != null && !statusFilter.isEmpty()) {
            try {
                OrderStatus status = OrderStatus.valueOf(statusFilter.toUpperCase());
                queryBuilder.append(" AND status = ?").append(params.size() + 1);
                params.add(status);
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Status inválido: " + statusFilter);
            }
        }

        return orderRepository.count(queryBuilder.toString(), params.toArray());
    }

    public List<OrderStatusHistoryResponse> getOrderStatusHistory(String tenantId, Long orderId) {
        tenantContext.setTenantId(tenantId);

        Order order = orderRepository.findByIdOptional(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));

        validarTenantId(order.tenantId, tenantId);

        return statusHistoryRepository.findByOrderId(orderId).stream()
                .map(OrderStatusHistoryResponse::new)
                .collect(Collectors.toList());
    }

    private void restaurarEstoque(Order order) {
        if (order.itens == null) {
            return;
        }
        for (OrderItem item : order.itens) {
            productRepository.findByIdOptional(item.produtoId)
                    .ifPresent(product -> product.estoqueAtual += item.quantidade);
        }
    }

    private BigDecimal calcularTaxaEntrega(String tenantId, String tipoEntrega) {
        if (!"ENTREGA".equalsIgnoreCase(tipoEntrega)) {
            return BigDecimal.ZERO;
        }
        return storeConfigRepository.findByTenantId(tenantId)
                .map(config -> config.taxaEntregaPadrao != null ? config.taxaEntregaPadrao : BigDecimal.ZERO)
                .orElse(BigDecimal.ZERO);
    }

    public List<OrderResponse> getOrdersByWhatsapp(String tenantId, String whatsapp) {
        tenantContext.setTenantId(tenantId);

        String whatsappInformado = somenteDigitos(whatsapp);
        if (whatsappInformado.isEmpty()) {
            return List.of();
        }

        return orderRepository.find("tenantId = ?1 ORDER BY criadoEm DESC", tenantId).list().stream()
                .filter(order -> whatsappInformado.equals(somenteDigitos(order.clienteWhatsapp)))
                .map(this::toOrderResponse)
                .toList();
    }

    private String somenteDigitos(String valor) {
        return valor == null ? "" : valor.replaceAll("\\D", "");
    }

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItem> itens = order.itens != null ? new ArrayList<>(order.itens) : new ArrayList<>();
        return new OrderResponse(order, itens);
    }

    private String gerarCodigoPedido() {
        LocalDateTime agora = LocalDateTime.now();
        String data = String.format("%04d%02d%02d", 
                agora.getYear(), agora.getMonthValue(), agora.getDayOfMonth());
        
        String sufixo = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

        return "PD-" + data + "-" + sufixo;
    }

    private boolean ehTransicaoValida(OrderStatus de, OrderStatus para) {
        Map<OrderStatus, Set<OrderStatus>> transicoes = new HashMap<>();
        transicoes.put(OrderStatus.PENDENTE, Set.of(OrderStatus.EM_PREPARO, OrderStatus.CANCELADO));
        transicoes.put(OrderStatus.EM_PREPARO, Set.of(OrderStatus.PRONTO_PARA_ENTREGA, OrderStatus.CANCELADO));
        transicoes.put(OrderStatus.PRONTO_PARA_ENTREGA, Set.of(OrderStatus.ENTREGUE, OrderStatus.CANCELADO));
        transicoes.put(OrderStatus.ENTREGUE, new HashSet<>());
        transicoes.put(OrderStatus.CANCELADO, new HashSet<>());

        return transicoes.getOrDefault(de, new HashSet<>()).contains(para);
    }

    private void validarTenantId(String orderTenantId, String requestTenantId) {
        if (!orderTenantId.equals(requestTenantId)) {
            throw new ResourceNotFoundException("Pedido não encontrado");
        }
    }
}
