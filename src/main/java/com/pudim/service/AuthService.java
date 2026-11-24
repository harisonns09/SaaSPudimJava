package com.pudim.service;

import com.pudim.model.LoginRequest;
import com.pudim.model.RegistrationRequest;
import com.pudim.model.StoreConfig;
import com.pudim.multitenancy.TenantContext;
import com.pudim.repository.StoreConfigRepository;
import com.pudim.exception.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.text.Normalizer;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class AuthService {

    @Inject
    LoginService loginService;

    @Inject
    StoreConfigRepository storeConfigRepository;

    @Inject
    TenantContext tenantContext;

    public String login(LoginRequest request) {
        return loginService.login(request);
    }

    @Transactional
    public String register(RegistrationRequest request) {
        if (request == null || isBlank(request.getStoreName())
                || isBlank(request.getEmail()) || isBlank(request.getPassword())) {
            throw new ValidationException("Nome da loja, e-mail e senha são obrigatórios.");
        }

        String tenantId = UUID.randomUUID().toString();
        tenantContext.setTenantId(tenantId);

        StoreConfig store = new StoreConfig();
        store.tenantId = tenantId;
        store.nomeLoja = request.getStoreName().trim();
        store.slug = generateSlug(store.nomeLoja);
        if (store.slug.isBlank()) {
            throw new ValidationException("O nome da loja precisa conter letras ou números.");
        }
        storeConfigRepository.persist(store);

        loginService.createUser(
                request.getEmail().trim(),
                request.getPassword(),
                tenantId,
                Set.of("admin")
        );

        LoginRequest login = new LoginRequest();
        login.setEmail(request.getEmail().trim());
        login.setPassword(request.getPassword());
        return loginService.login(login);
    }

    private String generateSlug(String storeName) {
        String normalized = Normalizer.normalize(storeName.trim(), Normalizer.Form.NFD);
        return normalized
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
