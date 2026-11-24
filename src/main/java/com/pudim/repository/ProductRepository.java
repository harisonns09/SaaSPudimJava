package com.pudim.repository;

import com.pudim.model.Product;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class ProductRepository implements PanacheRepository<Product> {

    public List<Product> findAvailableProducts() {
        return list("ativo = true and estoqueAtual > 0");
    }
}
