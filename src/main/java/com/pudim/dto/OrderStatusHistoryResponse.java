package com.pudim.dto;

import com.pudim.entity.OrderStatus;
import com.pudim.entity.OrderStatusHistory;

import java.time.LocalDateTime;

public class OrderStatusHistoryResponse {
    public Long id;
    public Long orderId;
    public OrderStatus statusAnterior;
    public OrderStatus statusNovo;
    public LocalDateTime alteradoEm;
    public String observacoes;

    public OrderStatusHistoryResponse() {}

    public OrderStatusHistoryResponse(OrderStatusHistory history) {
        this.id = history.id;
        this.orderId = history.orderId;
        this.statusAnterior = history.statusAnterior;
        this.statusNovo = history.statusNovo;
        this.alteradoEm = history.alteradoEm;
        this.observacoes = history.observacoes;
    }
}
