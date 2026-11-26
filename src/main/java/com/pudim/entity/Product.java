package com.pudim.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.math.BigDecimal;

@Entity
@Table(name = "products")
public class Product extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

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
