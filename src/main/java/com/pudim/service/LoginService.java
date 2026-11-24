package com.pudim.service;

import com.pudim.model.LoginRequest;
import com.pudim.model.User;
import io.quarkus.elytron.security.common.BcryptUtil;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;

import java.time.Duration;
import java.util.Set;

@ApplicationScoped
public class LoginService {

    @Inject
    EntityManager em;

    @Transactional
    public String login(LoginRequest loginRequest) {
        try {
            User user = em.createQuery("SELECT u FROM User u WHERE u.email = :email", User.class)
                    .setParameter("email", loginRequest.getEmail())
                    .getSingleResult();

            if (!BcryptUtil.matches(loginRequest.getPassword(), user.getPassword())) {
                throw new WebApplicationException("Usuário ou senha inválidos", Response.Status.UNAUTHORIZED);
            }

            return Jwt.issuer("https://pudim.com/issuer")
                    .upn(user.getEmail())
                    .groups(user.getRoles()) // Adiciona os papéis do usuário à claim 'groups'
                    .claim("tenant_id", user.getTenantId())
                    .expiresIn(Duration.ofHours(1))
                    .sign();

        } catch (NoResultException e) {
            throw new WebApplicationException("Usuário ou senha inválidos", Response.Status.UNAUTHORIZED);
        }
    }

    @Transactional
    public User createUser(String email, String password, String tenantId, Set<String> roles) {
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setPassword(BcryptUtil.bcryptHash(password));
        newUser.setTenantId(tenantId);
        newUser.setRoles(roles);
        em.persist(newUser);
        return newUser;
    }
}
