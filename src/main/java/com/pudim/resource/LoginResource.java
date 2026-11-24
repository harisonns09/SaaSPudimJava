package com.pudim.resource;

import com.pudim.model.LoginRequest;
import com.pudim.service.LoginService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/login")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class LoginResource {

    @Inject
    LoginService loginService;

    @POST
    public Response login(LoginRequest loginRequest) {
        String jwt = loginService.login(loginRequest);
        return Response.ok(new JwtResponse(jwt)).build();
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
