package com.pudim.repository;

import com.pudim.entity.StoreConfig;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

@ApplicationScoped
public class StoreConfigRepository implements PanacheRepository<StoreConfig> {

    @Inject
    DataSource dataSource;

    public Optional<StoreConfig> findBySlug(String slug) {
        return find("slug", slug).firstResultOptional();
    }

    public Optional<StoreConfig> findByTenantId(String tenantId) {
        return find("tenantId", tenantId).firstResultOptional();
    }

    public Optional<String> findTenantIdBySlug(String slug) {
        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(
                     "select tenantid from store_configs where slug = ?")) {
            statement.setString(1, slug);
            try (ResultSet result = statement.executeQuery()) {
                return result.next()
                        ? Optional.ofNullable(result.getString("tenantid"))
                        : Optional.empty();
            }
        } catch (SQLException exception) {
            throw new IllegalStateException("Não foi possível localizar a loja pelo slug.", exception);
        }
    }
}
