package com.pudim.service;

import com.pudim.model.StoreConfig;
import com.pudim.exception.ResourceNotFoundException;
import com.pudim.exception.ValidationException;
import com.pudim.multitenancy.TenantContext;
import com.pudim.repository.StoreConfigRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class StoreConfigService {

    @Inject
    StoreConfigRepository storeConfigRepository;

    @Inject
    TenantContext tenantContext;

    public StoreConfig getConfiguration(String tenantId) {
        setTenant(tenantId);
        return storeConfigRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Configuração da loja não encontrada."));
    }

    @Transactional
    public StoreConfig saveConfiguration(String tenantId, StoreConfig changes) {
        setTenant(tenantId);
        if (changes == null || changes.nomeLoja == null || changes.nomeLoja.isBlank()
                || changes.slug == null || changes.slug.isBlank()) {
            throw new ValidationException("Nome e slug da loja são obrigatórios.");
        }
        StoreConfig config = storeConfigRepository.findByTenantId(tenantId).orElse(null);

        if (config == null) {
            config = changes;
            config.tenantId = tenantId;
            storeConfigRepository.persist(config);
            return config;
        }

        config.nomeLoja = changes.nomeLoja.trim();
        config.slug = changes.slug;
        config.subtitulo = changes.subtitulo;
        config.taxaEntregaPadrao = changes.taxaEntregaPadrao;
        config.abertaParaEncomendas = changes.abertaParaEncomendas;
        return config;
    }

    private void setTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("A sessão não contém um tenant válido.");
        }
        tenantContext.setTenantId(tenantId);
    }
}
