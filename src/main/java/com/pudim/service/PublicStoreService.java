package com.pudim.service;

import com.pudim.dto.CreateOrderRequest;
import com.pudim.dto.OrderResponse;
import com.pudim.dto.ProductDTO;
import com.pudim.dto.PublicMenuResponse;
import com.pudim.entity.Product;
import com.pudim.entity.StoreConfig;
import com.pudim.exception.ResourceNotFoundException;
import com.pudim.exception.StoreInactiveException;
import com.pudim.exception.ValidationException;
import com.pudim.multitenancy.TenantContext;
import com.pudim.repository.ProductRepository;
import com.pudim.repository.StoreConfigRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

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
        verificarAtiva(store);
        List<Product> products = productRepository.findAvailableProducts();
        List<ProductDTO> productDTOs = products.stream()
                .map(ProductDTO::new)
                .toList();
        return new PublicMenuResponse(store, productDTOs);
    }

    // Sem @Transactional aqui: a transação (e a sessão Hibernate, que fixa o tenant discriminador)
    // só pode abrir depois que o tenantContext estiver definido, dentro de orderService.createOrder.
    public OrderResponse createOrder(String slug, CreateOrderRequest request) {
        String tenantId = storeConfigRepository.findTenantIdBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Loja não encontrada."));

        tenantContext.setTenantId(tenantId);
        verificarAtiva(storeConfigRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Loja não encontrada.")));

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

        tenantContext.setTenantId(tenantId);
        orderService.confirmarPagamentoInfinitePay(tenantId, orderNsu, transactionNsu, invoiceSlug);
    }

    private String textoObrigatorio(Map<String, Object> payload, String campo) {
        Object valor = payload.get(campo);
        if (valor == null || valor.toString().isBlank()) {
            throw new ValidationException("Campo obrigatório ausente no webhook: " + campo);
        }
        return valor.toString();
    }

    private void verificarAtiva(StoreConfig store) {
        if (!store.ativa) {
            throw new StoreInactiveException("Esta loja não está disponível no momento.");
        }
    }
}
