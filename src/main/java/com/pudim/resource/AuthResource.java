package com.pudim.resource;

import com.pudim.model.LoginRequest;
import com.pudim.model.RegistrationRequest;
import com.pudim.model.StoreConfig;
import com.pudim.service.LoginService;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.text.Normalizer;
import java.util.Set;
import java.util.UUID;

@Path("/api/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    LoginService loginService;

    @POST
    @Path("/login")
    public Response login(LoginRequest loginRequest) {
        String jwt = loginService.login(loginRequest);
        return Response.ok(new JwtResponse(jwt)).build();
    }

    @POST
    @Path("/register")
    @Transactional
    public Response register(RegistrationRequest request) {
        // 1. Gerar tenantId e slug
        String tenantId = UUID.randomUUID().toString();
        String slug = generateSlug(request.getStoreName());

        // 2. Criar a configuração da loja
        StoreConfig newStore = new StoreConfig();
        newStore.tenantId = tenantId;
        newStore.slug = slug;
        newStore.nomeLoja = request.getStoreName();
        newStore.persist();

        // 3. Criar o usuário administrador
        loginService.createUser(
                request.getEmail(),
                request.getPassword(),
                tenantId,
                Set.of("admin") // O primeiro usuário é sempre admin
        );

        // 4. Fazer o login do novo usuário e retornar o token
        LoginRequest newLogin = new LoginRequest();
        newLogin.setEmail(request.getEmail());
        newLogin.setPassword(request.getPassword());
        String jwt = loginService.login(newLogin);

        return Response.status(Response.Status.CREATED).entity(new JwtResponse(jwt)).build();
    }

    private String generateSlug(String text) {
        String nowhitespace = text.replaceAll("[\\s]", "-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = normalized.replaceAll("[^\\p{ASCII}]", "");
        return slug.toLowerCase().replaceAll("[^a-z0-9-]", "");
    }

    // Classe interna para a resposta do JWT
    public static class JwtResponse {
        private final String token;

        public JwtResponse(String token) {
            this.token = token;
        }

        public String getToken() {
            return token;
        }
    }
}
