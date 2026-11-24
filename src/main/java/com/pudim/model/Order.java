package com.pudim.model;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import io.vertx.core.json.JsonArray;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.TenantId;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class Order extends PanacheEntity {

    @TenantId
    @Column(length = 50, nullable = false)
    public String tenantId;

    @Column(length = 10, unique = true)
    public String codigo;

    @Column(nullable = false)
    public String clienteNome;

    public String clienteWhatsapp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public OrderStatus status = OrderStatus.PENDENTE;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    public JsonArray itens;

    @Column(nullable = false)
    public BigDecimal valorTotal;

    @Column(nullable = false)
    public LocalDateTime criadoEm = LocalDateTime.now();

    // Outros campos do frontend que podem ser adicionados:
    // public String tipoEntrega;
    // public String endereco;
    // public String observacoes;
    // public BigDecimal subtotal;
    // public BigDecimal taxaEntrega;
    // public String origem;
}
