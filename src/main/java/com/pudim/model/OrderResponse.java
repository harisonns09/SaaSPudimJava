package com.pudim.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderResponse {
    public Long id;
    public String codigo;
    public String clienteNome;
    public String clienteWhatsapp;
    public String clienteEmail;
    public OrderStatus status;
    public List<OrderItem> itens;
    public BigDecimal valorTotal;
    public String tipoEntrega;
    public String endereco;
    public String observacoes;
    public LocalDateTime criadoEm;
    public LocalDateTime atualizadoEm;

    public OrderResponse() {}

    public OrderResponse(Order order, List<OrderItem> itens) {
        this.id = order.id;
        this.codigo = order.codigo;
        this.clienteNome = order.clienteNome;
        this.clienteWhatsapp = order.clienteWhatsapp;
        this.clienteEmail = order.clienteEmail;
        this.status = order.status;
        this.itens = itens;
        this.valorTotal = order.valorTotal;
        this.tipoEntrega = order.tipoEntrega;
        this.endereco = order.endereco;
        this.observacoes = order.observacoes;
        this.criadoEm = order.criadoEm;
        this.atualizadoEm = order.atualizadoEm;
    }
}
