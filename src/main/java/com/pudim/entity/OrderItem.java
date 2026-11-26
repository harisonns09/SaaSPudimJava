package com.pudim.entity;

import java.math.BigDecimal;

public class OrderItem {
    public Long produtoId;
    public String produtoNome;
    public Integer quantidade;
    public BigDecimal preco;
    public BigDecimal subtotal;

    public OrderItem() {}

    public OrderItem(Long produtoId, String produtoNome, Integer quantidade, BigDecimal preco) {
        this.produtoId = produtoId;
        this.produtoNome = produtoNome;
        this.quantidade = quantidade;
        this.preco = preco;
        this.subtotal = preco.multiply(new BigDecimal(quantidade));
    }

    public BigDecimal getSubtotal() {
        if (preco != null && quantidade != null) {
            return preco.multiply(new BigDecimal(quantidade));
        }
        return subtotal;
    }
}
