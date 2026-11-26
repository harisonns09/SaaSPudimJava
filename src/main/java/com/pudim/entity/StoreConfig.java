package com.pudim.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "store_configs")
public class StoreConfig extends PanacheEntity {

    // Registro global de lojas: sem @TenantId, pois as buscas por slug ocorrem antes do tenant ser conhecido.
    @Column(length = 50, nullable = false, unique = true)
    public String tenantId;

    @Column(nullable = false)
    public String nomeLoja;

    @Column(nullable = false, unique = true)
    public String slug;

    public String subtitulo;

    public BigDecimal taxaEntregaPadrao;

    public boolean abertaParaEncomendas = true;

    // Lojas desativadas pelo superadmin: não fazem login nem recebem pedidos. Default true para as lojas já existentes.
    @Column(nullable = false, columnDefinition = "boolean not null default true")
    public boolean ativa = true;

    // InfinitePay Checkout: InfiniteTag da loja (sem o "$"). Se nulo, pedidos são criados sem cobrança online.
    public String infinitepayHandle;

    // Tipo de produto vendido pela loja (ex.: Pudim, Roupas, Eletrônicos). Usado nos textos do cardápio e do admin.
    @Column(name = "tipo_negocio", length = 60)
    public String tipoNegocio = "Geral";

    // Outros campos do frontend que podem ser adicionados:
    // public String tempoPreparoMedio;
    // public String enderecoRetirada;
    // public String bannerUrl;
    // public String whatsappId;
}
