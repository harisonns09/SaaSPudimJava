package com.pudim.service;

import com.pudim.dto.LoginRequest;
import com.pudim.entity.User;
import com.pudim.exception.InvalidCredentialsException;
import com.pudim.exception.StoreInactiveException;
import com.pudim.repository.StoreConfigRepository;
import com.pudim.repository.UserRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Duration;
import java.util.Set;

@ApplicationScoped
public class LoginService {

    static final String SUPERADMIN_ROLE = "superadmin";

    @Inject
    UserRepository userRepository;

    @Inject
    StoreConfigRepository storeConfigRepository;

    @Transactional
    public String login(LoginRequest loginRequest) {
        User user = userRepository.findByLogin(loginRequest.getEmail().trim())
                .orElseThrow(InvalidCredentialsException::new);

        if (!BcryptUtil.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        if (!user.getRoles().contains(SUPERADMIN_ROLE)) {
            verificarLojaAtiva(user.getTenantId());
        }

        return Jwt.issuer("https://pudim.com/issuer")
                .upn(user.getEmail())
                .groups(user.getRoles())
                .claim("tenant_id", user.getTenantId())
                .expiresIn(Duration.ofHours(1))
                .sign();
    }

    /**
     * Token de suporte: o superadmin entra na loja como admin dela. A claim impersonated_by
     * identifica quem está operando, para auditoria.
     */
    public String issueImpersonationToken(String tenantId, String superadminEmail) {
        return Jwt.issuer("https://pudim.com/issuer")
                .upn(superadminEmail)
                .groups(Set.of("admin"))
                .claim("tenant_id", tenantId)
                .claim("impersonated_by", superadminEmail)
                .expiresIn(Duration.ofHours(1))
                .sign();
    }

    private void verificarLojaAtiva(String tenantId) {
        storeConfigRepository.findByTenantId(tenantId)
                .filter(store -> !store.ativa)
                .ifPresent(store -> {
                    throw new StoreInactiveException("Esta loja está desativada. Entre em contato com o suporte.");
                });
    }

    @Transactional
    public User createUser(String email, String password, String tenantId, Set<String> roles) {
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setPassword(BcryptUtil.bcryptHash(password));
        newUser.setTenantId(tenantId);
        newUser.setRoles(roles);
        userRepository.persist(newUser);
        return newUser;
    }
}
