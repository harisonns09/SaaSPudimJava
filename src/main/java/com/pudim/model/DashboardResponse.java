package com.pudim.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class DashboardResponse {
    public long totalPedidos;
    public long pedidosHoje;
    public long pedidosAtivos;
    public BigDecimal faturamentoTotal;
    public BigDecimal faturamentoHoje;
    public BigDecimal ticketMedio;
    public Map<String, Long> pedidosPorStatus;
    public List<TopProduto> topProdutos;
    public List<PedidoResumo> pedidosRecentes;

    public static class TopProduto {
        public Long produtoId;
        public String produtoNome;
        public long quantidade;
        public BigDecimal faturamento;

        public TopProduto() {}

        public TopProduto(Long produtoId, String produtoNome, long quantidade, BigDecimal faturamento) {
            this.produtoId = produtoId;
            this.produtoNome = produtoNome;
            this.quantidade = quantidade;
            this.faturamento = faturamento;
        }
    }

    public static class PedidoResumo {
        public Long id;
        public String codigo;
        public String clienteNome;
        public OrderStatus status;
        public BigDecimal valorTotal;
        public LocalDateTime criadoEm;

        public PedidoResumo() {}

        public PedidoResumo(Long id, String codigo, String clienteNome, OrderStatus status,
                            BigDecimal valorTotal, LocalDateTime criadoEm) {
            this.id = id;
            this.codigo = codigo;
            this.clienteNome = clienteNome;
            this.status = status;
            this.valorTotal = valorTotal;
            this.criadoEm = criadoEm;
        }
    }
}
