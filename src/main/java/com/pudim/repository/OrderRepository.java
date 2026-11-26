package com.pudim.repository;

import com.pudim.entity.Order;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class OrderRepository implements PanacheRepository<Order> {

    public Optional<Order> findByCodigo(String codigo) {
        return find("codigo = ?1", codigo).firstResultOptional();
    }

    public List<Order> findByTenantIdAndClienteNome(String tenantId, String clienteNome) {
        return find("tenantId = ?1 AND clienteNome ILIKE ?2 ORDER BY criadoEm DESC",
                tenantId, "%" + clienteNome + "%").list();
    }

    public long countByCodigo() {
        return count();
    }
}

