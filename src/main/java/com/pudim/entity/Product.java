package com.pudim.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.TenantId;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product extends PanacheEntity {

    @TenantId
    @Column(length = 50, nullable = false)
    public String tenantId;

    @Column(nullable = false)
    public String nome;

    public String descricao;

    @Column(nullable = false)
    public BigDecimal precoVenda;

    public BigDecimal custoEstimado;

    public int pesoGramas;

    public int estoqueAtual;

    @Column(length = 1000)
    public String imagemUrl;

    public String destaque;

    public boolean ativo = true;
}
