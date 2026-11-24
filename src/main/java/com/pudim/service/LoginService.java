package com.pudim.service;

import com.pudim.model.LoginRequest;
import com.pudim.model.User;
import com.pudim.exception.InvalidCredentialsException;
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

    @Inject
    UserRepository userRepository;

    @Transactional
    public String login(LoginRequest loginRequest) {
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(InvalidCredentialsException::new);

        if (!BcryptUtil.matches(loginRequest.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        return Jwt.issuer("https://pudim.com/issuer")
                .upn(user.getEmail())
                .groups(user.getRoles())
                .claim("tenant_id", user.getTenantId())
                .expiresIn(Duration.ofHours(1))
                .sign();
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
