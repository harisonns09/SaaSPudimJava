package com.pudim.dto;

import com.pudim.entity.Product;

import java.math.BigDecimal;

public class ProductDTO {
    public Long id;
    public String nome;
    public String descricao;
    public BigDecimal precoVenda;
    public BigDecimal custoEstimado;
    public int pesoGramas;
    public int estoqueAtual;
    public String imagemUrl;
    public String destaque;
    public boolean ativo;

    public ProductDTO() {}

    public ProductDTO(Product product) {
        this.id = product.id;
        this.nome = product.nome;
        this.descricao = product.descricao;
        this.precoVenda = product.precoVenda;
        this.custoEstimado = product.custoEstimado;
        this.pesoGramas = product.pesoGramas;
        this.estoqueAtual = product.estoqueAtual;
        this.imagemUrl = product.imagemUrl;
        this.destaque = product.destaque;
        this.ativo = product.ativo;
    }
}
