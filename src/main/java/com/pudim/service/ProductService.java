package com.pudim.service;

import com.pudim.model.Product;
import com.pudim.exception.ResourceNotFoundException;
import com.pudim.exception.ValidationException;
import com.pudim.multitenancy.TenantContext;
import com.pudim.repository.ProductRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.math.BigDecimal;
import java.util.List;

@ApplicationScoped
public class ProductService {

    @Inject
    ProductRepository productRepository;

    @Inject
    TenantContext tenantContext;

    public List<Product> listProducts(String tenantId) {
        setTenant(tenantId);
        return productRepository.listAll();
    }

    @Transactional
    public Product createProduct(String tenantId, Product product) {
        setTenant(tenantId);
        validate(product);
        product.tenantId = tenantId;
        productRepository.persist(product);
        return product;
    }

    @Transactional
    public Product updateProduct(String tenantId, Long productId, Product changes) {
        setTenant(tenantId);
        validate(changes);
        Product product = findProduct(productId);
        product.nome = changes.nome;
        product.descricao = changes.descricao;
        product.precoVenda = changes.precoVenda;
        product.custoEstimado = changes.custoEstimado;
        product.pesoGramas = changes.pesoGramas;
        product.estoqueAtual = changes.estoqueAtual;
        product.imagemUrl = changes.imagemUrl;
        product.destaque = changes.destaque;
        product.ativo = changes.ativo;
        return product;
    }

    @Transactional
    public Product updateProductStatus(String tenantId, Long productId, boolean active) {
        setTenant(tenantId);
        Product product = findProduct(productId);
        product.ativo = active;
        return product;
    }

    @Transactional
    public Product adjustStock(String tenantId, Long productId, int delta) {
        setTenant(tenantId);
        Product product = findProduct(productId);
        int updatedStock = product.estoqueAtual + delta;
        if (updatedStock < 0) {
            throw new ValidationException("O estoque não pode ficar negativo.");
        }
        product.estoqueAtual = updatedStock;
        return product;
    }

    @Transactional
    public void deleteProduct(String tenantId, Long productId) {
        setTenant(tenantId);
        Product product = findProduct(productId);
        productRepository.delete(product);
    }

    private Product findProduct(Long productId) {
        return productRepository.findByIdOptional(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Produto não encontrado."));
    }

    private void setTenant(String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalStateException("A sessão não contém um tenant válido.");
        }
        tenantContext.setTenantId(tenantId);
    }

    private void validate(Product product) {
        if (product == null
                || product.nome == null || product.nome.isBlank()
                || product.precoVenda == null || product.precoVenda.compareTo(BigDecimal.ZERO) <= 0
                || product.pesoGramas <= 0
                || product.estoqueAtual < 0
                || (product.custoEstimado != null && product.custoEstimado.compareTo(BigDecimal.ZERO) < 0)) {
            throw new ValidationException("Informe nome, preço e peso válidos, além de estoque e custo não negativos.");
        }
    }
}
