package com.pudim.service;

import com.pudim.exception.ResourceNotFoundException;
import com.pudim.exception.ValidationException;
import com.pudim.model.*;
import com.pudim.multitenancy.TenantContext;
import com.pudim.repository.ProductRepository;
import com.pudim.repository.StoreConfigRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.Map;

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
        
        tenantContext.setTenantId(tenantId);
        return orderService.createOrder(tenantId, request);
    }

    public List<OrderResponse> getOrdersTracking(String slug, String whatsapp) {
        String tenantId = storeConfigRepository.findTenantIdBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Loja não encontrada."));
        return orderService.getOrdersByWhatsapp(tenantId, whatsapp);
    }

    public void receberWebhookInfinitePay(String slug, Map<String, Object> payload) {
        String tenantId = storeConfigRepository.findTenantIdBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Loja não encontrada."));

        String orderNsu = textoObrigatorio(payload, "order_nsu");
        String transactionNsu = textoObrigatorio(payload, "transaction_nsu");
        String invoiceSlug = textoObrigatorio(payload, "invoice_slug");

        orderService.confirmarPagamentoInfinitePay(tenantId, orderNsu, transactionNsu, invoiceSlug);
    }

    private String textoObrigatorio(Map<String, Object> payload, String campo) {
        Object valor = payload.get(campo);
        if (valor == null || valor.toString().isBlank()) {
            throw new ValidationException("Campo obrigatório ausente no webhook: " + campo);
        }
        return valor.toString();
    }
}
