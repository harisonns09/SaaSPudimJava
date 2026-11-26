package com.pudim.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;

@Entity
@Table(name = "order_status_history")
public class OrderStatusHistory extends PanacheEntity {

    @TenantId
    @Column(length = 50, nullable = false)
    public String tenantId;

    @Column(nullable = false)
    public Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public OrderStatus statusAnterior;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    public OrderStatus statusNovo;

    @Column(nullable = false)
    public LocalDateTime alteradoEm = LocalDateTime.now();

    @Column(length = 500)
    public String observacoes;

    public OrderStatusHistory() {}

    public OrderStatusHistory(String tenantId, Long orderId, OrderStatus statusAnterior,
                              OrderStatus statusNovo, String observacoes) {
        this.tenantId = tenantId;
        this.orderId = orderId;
        this.statusAnterior = statusAnterior;
        this.statusNovo = statusNovo;
        this.observacoes = observacoes;
    }
}
