package com.pudim.repository;

import com.pudim.model.OrderStatusHistory;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;

@ApplicationScoped
public class OrderStatusHistoryRepository implements PanacheRepository<OrderStatusHistory> {

    public List<OrderStatusHistory> findByOrderId(Long orderId) {
        return find("orderId = ?1 ORDER BY alteradoEm DESC", orderId).list();
    }
}
