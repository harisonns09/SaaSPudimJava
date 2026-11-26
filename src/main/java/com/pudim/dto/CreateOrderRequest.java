package com.pudim.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class CreateOrderRequest {
    
    @NotBlank(message = "Nome do cliente é obrigatório")
    public String clienteNome;

    public String clienteWhatsapp;

    public String clienteEmail;

    @NotEmpty(message = "Pedido deve ter pelo menos um item")
    public List<OrderItemRequest> itens;

    @NotBlank(message = "Tipo de entrega é obrigatório")
    public String tipoEntrega;

    public String endereco;

    public String observacoes;

    public boolean aceiteTermos;

    public CreateOrderRequest() {}
}
