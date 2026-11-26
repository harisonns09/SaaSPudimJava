package com.pudim.service;

import com.pudim.dto.LoginRequest;
import com.pudim.dto.RegistrationRequest;
import com.pudim.exception.ValidationException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AuthService {

    @Inject
    LoginService loginService;

    @Inject
    StoreConfigService storeConfigService;

    public String login(LoginRequest request) {
        return loginService.login(request);
    }

    @Transactional
    public String register(RegistrationRequest request) {
        if (request == null) {
            throw new ValidationException("Nome da loja, e-mail e senha são obrigatórios.");
        }

        storeConfigService.createStore(request.getStoreName(), request.getEmail(), request.getPassword());

        LoginRequest login = new LoginRequest();
        login.setEmail(request.getEmail().trim());
        login.setPassword(request.getPassword());
        return loginService.login(login);
    }
}
