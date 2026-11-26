package com.pudim.service;

import com.pudim.entity.User;
import com.pudim.repository.UserRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.runtime.Startup;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

/**
 * Cria o usuário superadmin na inicialização, a partir das variáveis de ambiente
 * SUPERADMIN_USERNAME e SUPERADMIN_PASSWORD. Se não existir, cria; se já existir, não altera nada.
 */
@Startup
@ApplicationScoped
public class SuperAdminBootstrap {

    static final String SUPERADMIN_TENANT = "superadmin";

    @ConfigProperty(name = "superadmin.username")
    Optional<String> username;

    @ConfigProperty(name = "superadmin.password")
    Optional<String> password;

    @Inject
    UserRepository userRepository;

    @Transactional
    void onStart(@Observes StartupEvent event) {
        if (username.isEmpty() || password.isEmpty()) {
            return;
        }
        String login = username.get().trim();
        if (userRepository.findByLogin(login).isPresent()) {
            return;
        }
        User superadmin = new User();
        superadmin.setUsername(login);
        superadmin.setEmail(login + "@superadmin.pudimflow.local");
        superadmin.setPassword(BcryptUtil.bcryptHash(password.get()));
        superadmin.setTenantId(SUPERADMIN_TENANT);
        superadmin.setRoles(new HashSet<>(Set.of(LoginService.SUPERADMIN_ROLE)));
        userRepository.persist(superadmin);
    }
}
