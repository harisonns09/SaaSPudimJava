package com.pudim.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.TenantId;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

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
    public List<OrderItem> itens;

    @Column(nullable = false)
    public BigDecimal valorTotal;

    public String tipoEntrega;

    public String endereco;

    @Column(length = 1000)
    public String observacoes;

    // Aceite dos termos e política de privacidade (LGPD: comprovação do consentimento)
    @Column(name = "aceite_termos", nullable = false, updatable = false)
    public boolean aceiteTermos;

    @Column(name = "aceite_termos_em", updatable = false)
    public LocalDateTime aceiteTermosEm;

    @Column(nullable = false, updatable = false)
    public LocalDateTime criadoEm = LocalDateTime.now();

    @Column(nullable = false)
    public LocalDateTime atualizadoEm = LocalDateTime.now();

    // Pagamento (InfinitePay): AGUARDANDO, PAGO ou NAO_APLICA (loja sem handle configurado).
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) not null default 'NAO_APLICA'")
    public String pagamentoStatus = "NAO_APLICA";

    @Column(length = 1000)
    public String pagamentoUrl;

    @Column(length = 100)
    public String pagamentoInvoiceSlug;

    @Column(length = 100)
    public String pagamentoTransactionNsu;

    public BigDecimal pagamentoValorPago;

    public LocalDateTime pagoEm;
}
