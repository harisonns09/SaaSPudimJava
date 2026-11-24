package com.pudim.service;

import com.pudim.exception.ResourceNotFoundException;
import com.pudim.exception.ValidationException;
import com.pudim.model.*;
import com.pudim.multitenancy.TenantContext;
import com.pudim.repository.OrderRepository;
import com.pudim.repository.OrderStatusHistoryRepository;
import com.pudim.repository.ProductRepository;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Sort;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class OrderService {

    @Inject
    OrderRepository orderRepository;

    @Inject
    OrderStatusHistoryRepository statusHistoryRepository;

    @Inject
    ProductRepository productRepository;

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
        }

        Order order = new Order();
        order.tenantId = tenantId;
        order.codigo = gerarCodigoPedido();
        order.clienteNome = request.clienteNome;
        order.clienteWhatsapp = request.clienteWhatsapp;
        order.clienteEmail = request.clienteEmail;
        order.status = OrderStatus.PENDENTE;
        order.itens = new JsonArray(ordenados.stream()
                .map(item -> JsonObject.mapFrom(item))
                .collect(Collectors.toList()));
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
                null,
                OrderStatus.PENDENTE,
                "Pedido criado"
        ));

        return new OrderResponse(order, ordenados);
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

    public List<OrderStatusHistory> getOrderStatusHistory(String tenantId, Long orderId) {
        tenantContext.setTenantId(tenantId);

        Order order = orderRepository.findByIdOptional(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido não encontrado"));

        validarTenantId(order.tenantId, tenantId);

        return statusHistoryRepository.findByOrderId(orderId);
    }

    private OrderResponse toOrderResponse(Order order) {
        List<OrderItem> itens = new ArrayList<>();
        if (order.itens != null) {
            for (Object obj : order.itens) {
                JsonObject json = (JsonObject) obj;
                itens.add(json.mapTo(OrderItem.class));
            }
        }
        return new OrderResponse(order, itens);
    }

    private String gerarCodigoPedido() {
        LocalDateTime agora = LocalDateTime.now();
        String data = String.format("%04d%02d%02d", 
                agora.getYear(), agora.getMonthValue(), agora.getDayOfMonth());
        
        long count = orderRepository.countByCodigo() + 1;
        String numero = String.format("%06d", count % 1000000);
        
        return "PD-" + data + "-" + numero;
    }

    private boolean ehTransicaoValida(OrderStatus de, OrderStatus para) {
        Map<OrderStatus, Set<OrderStatus>> transicoes = new HashMap<>();
        transicoes.put(OrderStatus.PENDENTE, Set.of(OrderStatus.EM_PREPARO, OrderStatus.CANCELADO));
        transicoes.put(OrderStatus.EM_PREPARO, Set.of(OrderStatus.PRONTO_PARA_ENTREGA, OrderStatus.CANCELADO));
        transicoes.put(OrderStatus.PRONTO_PARA_ENTREGA, Set.of(OrderStatus.SAIU_PARA_ENTREGA, OrderStatus.CANCELADO));
        transicoes.put(OrderStatus.SAIU_PARA_ENTREGA, Set.of(OrderStatus.ENTREGUE, OrderStatus.CANCELADO));
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
