package com.pudim.dto;

import com.pudim.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateOrderStatusRequest {

    @NotNull(message = "Novo status é obrigatório")
    public OrderStatus novoStatus;

    public String observacoes;

    public UpdateOrderStatusRequest() {}

    public UpdateOrderStatusRequest(OrderStatus novoStatus, String observacoes) {
        this.novoStatus = novoStatus;
        this.observacoes = observacoes;
    }
}
