package com.pudim.service;

import com.pudim.dto.DashboardResponse;
import com.pudim.dto.DashboardResponse.PedidoResumo;
import com.pudim.dto.DashboardResponse.TopProduto;
import com.pudim.entity.Order;
import com.pudim.entity.OrderItem;
import com.pudim.entity.OrderStatus;
import com.pudim.multitenancy.TenantContext;
import com.pudim.repository.OrderRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class DashboardService {

    private static final int TOP_PRODUTOS_LIMIT = 5;
    private static final int PEDIDOS_RECENTES_LIMIT = 5;

    @Inject
    OrderRepository orderRepository;

    @Inject
    TenantContext tenantContext;

    public DashboardResponse getDashboard(String tenantId) {
        tenantContext.setTenantId(tenantId);

        List<Order> pedidos = orderRepository.list("tenantId = ?1 ORDER BY criadoEm DESC", tenantId);
        LocalDateTime inicioHoje = LocalDate.now().atStartOfDay();

        DashboardResponse dto = new DashboardResponse();
        dto.totalPedidos = pedidos.size();

        Map<String, Long> porStatus = new LinkedHashMap<>();
        for (OrderStatus s : OrderStatus.values()) {
            porStatus.put(s.name(), 0L);
        }

        BigDecimal faturamentoTotal = BigDecimal.ZERO;
        BigDecimal faturamentoHoje = BigDecimal.ZERO;
        long pedidosHoje = 0;
        long pedidosAtivos = 0;
        long pedidosValidos = 0;
        Map<Long, TopProduto> produtos = new HashMap<>();

        for (Order pedido : pedidos) {
            OrderStatus status = pedido.status != null ? pedido.status : OrderStatus.PENDENTE;
            porStatus.merge(status.name(), 1L, Long::sum);

            boolean hoje = pedido.criadoEm != null && !pedido.criadoEm.isBefore(inicioHoje);
            if (hoje) {
                pedidosHoje++;
            }

            if (status == OrderStatus.CANCELADO) {
                continue;
            }

            if (status != OrderStatus.ENTREGUE) {
                pedidosAtivos++;
            }

            BigDecimal valor = pedido.valorTotal != null ? pedido.valorTotal : BigDecimal.ZERO;
            faturamentoTotal = faturamentoTotal.add(valor);
            pedidosValidos++;
            if (hoje) {
                faturamentoHoje = faturamentoHoje.add(valor);
            }

            if (pedido.itens != null) {
                for (OrderItem item : pedido.itens) {
                    if (item.produtoId == null || item.quantidade == null) {
                        continue;
                    }
                    BigDecimal subtotal = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
                    produtos.merge(item.produtoId,
                            new TopProduto(item.produtoId, item.produtoNome, item.quantidade, subtotal),
                            (a, b) -> new TopProduto(a.produtoId, a.produtoNome,
                                    a.quantidade + b.quantidade, a.faturamento.add(b.faturamento)));
                }
            }
        }

        dto.pedidosHoje = pedidosHoje;
        dto.pedidosAtivos = pedidosAtivos;
        dto.faturamentoTotal = faturamentoTotal;
        dto.faturamentoHoje = faturamentoHoje;
        dto.ticketMedio = pedidosValidos == 0
                ? BigDecimal.ZERO
                : faturamentoTotal.divide(BigDecimal.valueOf(pedidosValidos), 2, RoundingMode.HALF_UP);
        dto.pedidosPorStatus = porStatus;

        dto.topProdutos = produtos.values().stream()
                .sorted(Comparator.comparingLong((TopProduto t) -> t.quantidade).reversed())
                .limit(TOP_PRODUTOS_LIMIT)
                .collect(Collectors.toList());

        dto.pedidosRecentes = pedidos.stream()
                .limit(PEDIDOS_RECENTES_LIMIT)
                .map(p -> new PedidoResumo(p.id, p.codigo, p.clienteNome, p.status, p.valorTotal, p.criadoEm))
                .collect(Collectors.toList());

        return dto;
    }
}
