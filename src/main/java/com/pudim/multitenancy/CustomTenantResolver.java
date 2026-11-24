package com.pudim.multitenancy;

import io.quarkus.arc.Unremovable;
import io.quarkus.hibernate.orm.PersistenceUnitExtension;
import io.quarkus.hibernate.orm.runtime.tenant.TenantResolver;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

@RequestScoped
@Unremovable
@PersistenceUnitExtension
public class CustomTenantResolver implements TenantResolver {

    @Inject
    TenantContext tenantContext;

    @Inject
    JsonWebToken jwt;

    @Override
    public String getDefaultTenantId() {
        // CORREÇÃO: Retornar a string literal que o Quarkus espera para o datasource padrão.
        return "<default>";
    }

    @Override
    public String resolveTenantId() {
        String tenantId = tenantContext.getTenantId();
        if (tenantId != null) {
            return tenantId;
        }

        if (jwt != null && jwt.containsClaim("tenant_id")) {
            return jwt.getClaim("tenant_id");
        }

        return getDefaultTenantId();
    }
}
