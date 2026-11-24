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

    @Column(length = 20, unique = true, nullable = false)
    public String codigo;

    @Column(nullable = false)
    public String clienteNome;

    public String clienteWhatsapp;

    public String clienteEmail;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public OrderStatus status = OrderStatus.PENDENTE;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    public JsonArray itens;

    @Column(nullable = false)
    public BigDecimal valorTotal;

    public String tipoEntrega;

    public String endereco;

    @Column(length = 1000)
    public String observacoes;

    @Column(nullable = false, updatable = false)
    public LocalDateTime criadoEm = LocalDateTime.now();

    @Column(nullable = false)
    public LocalDateTime atualizadoEm = LocalDateTime.now();
}
