package com.pudim.service;

import com.pudim.dto.CompradorProdutoResponse;
import com.pudim.entity.Order;
import com.pudim.entity.OrderItem;
import com.pudim.entity.OrderStatus;
import com.pudim.repository.OrderRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class RelatorioService {

    @Inject
    OrderRepository orderRepository;

    // Usa o repositório (JPQL pelos nomes dos campos) para não depender dos nomes físicos das colunas
    public List<CompradorProdutoResponse> compradoresPorProduto(String tenantId, Long produtoId) {
        List<Order> pedidos = orderRepository.list(
                "tenantId = ?1 AND status <> ?2 ORDER BY criadoEm DESC", tenantId, OrderStatus.CANCELADO);

        List<CompradorProdutoResponse> resultado = new ArrayList<>();
        for (Order pedido : pedidos) {
            if (pedido.itens == null) {
                continue;
            }
            for (OrderItem item : pedido.itens) {
                if (produtoId != null && !produtoId.equals(item.produtoId)) {
                    continue;
                }
                resultado.add(mapear(pedido, item));
            }
        }
        return resultado;
    }

    private CompradorProdutoResponse mapear(Order pedido, OrderItem item) {
        CompradorProdutoResponse r = new CompradorProdutoResponse();
        r.pedidoId = pedido.id;
        r.codigoPedido = pedido.codigo;
        r.criadoEm = pedido.criadoEm;
        r.status = pedido.status != null ? pedido.status.name() : null;
        r.clienteNome = pedido.clienteNome;
        r.clienteWhatsapp = pedido.clienteWhatsapp;
        r.clienteEmail = pedido.clienteEmail;
        r.produtoId = item.produtoId;
        r.produtoNome = item.produtoNome;
        r.quantidade = item.quantidade;
        r.precoUnitario = item.preco;
        return r;
    }
}
