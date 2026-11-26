package com.pudim.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class CompradorProdutoResponse {

    public Long pedidoId;
    public String codigoPedido;
    public LocalDateTime criadoEm;
    public String status;
    public String clienteNome;
    public String clienteWhatsapp;
    public String clienteEmail;
    public Long produtoId;
    public String produtoNome;
    public Integer quantidade;
    public BigDecimal precoUnitario;

    public CompradorProdutoResponse() {}
}
