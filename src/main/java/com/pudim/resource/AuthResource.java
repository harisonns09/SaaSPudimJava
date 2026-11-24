package com.pudim.resource;

import com.pudim.model.LoginRequest;
import com.pudim.model.RegistrationRequest;
import com.pudim.service.AuthService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

    @POST
    @Path("/login")
    public Response login(LoginRequest request) {
        return Response.ok(new JwtResponse(authService.login(request))).build();
    }

    @POST
    @Path("/register")
    public Response register(RegistrationRequest request) {
        String token = authService.register(request);
        return Response.status(Response.Status.CREATED).entity(new JwtResponse(token)).build();
    }

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
