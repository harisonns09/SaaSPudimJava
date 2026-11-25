package com.pudim.model;

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

    // Outros campos do frontend que podem ser adicionados:
    // public String tempoPreparoMedio;
    // public String enderecoRetirada;
    // public String bannerUrl;
    // public String whatsappId;
}
