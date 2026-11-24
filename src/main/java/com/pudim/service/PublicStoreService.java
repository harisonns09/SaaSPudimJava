package com.pudim.service;

import com.pudim.model.*;
import com.pudim.exception.ResourceNotFoundException;
import com.pudim.multitenancy.TenantContext;
import com.pudim.repository.StoreConfigRepository;
import com.pudim.repository.ProductRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class PublicStoreService {

    @Inject
    StoreConfigRepository storeConfigRepository;

    @Inject
    ProductRepository productRepository;

    @Inject
    OrderService orderService;

    @Inject
    TenantContext tenantContext;

    public PublicMenuResponse getMenu(String slug) {
        String tenantId = storeConfigRepository.findTenantIdBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Loja não encontrada."));
        tenantContext.setTenantId(tenantId);

        StoreConfig store = storeConfigRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Loja não encontrada."));
        List<Product> products = productRepository.findAvailableProducts();
        return new PublicMenuResponse(store, products);
    }

    @Transactional
    public OrderResponse createOrder(String slug, CreateOrderRequest request) {
        String tenantId = storeConfigRepository.findTenantIdBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Loja não encontrada."));
        
        return orderService.createOrder(tenantId, request);
    }
}
