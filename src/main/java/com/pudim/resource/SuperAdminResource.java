package com.pudim.resource;

import com.pudim.dto.CreateStoreRequest;
import com.pudim.dto.StoreConfigUpdateRequest;
import com.pudim.dto.StoreStatusRequest;
import com.pudim.entity.StoreConfig;
import com.pudim.service.LoginService;
import com.pudim.service.StoreConfigService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.List;
import java.util.Map;

/**
 * Área do dono da plataforma: gestão de todas as lojas e acesso de suporte.
 */
@Path("/api/superadmin/lojas")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("superadmin")
public class SuperAdminResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    StoreConfigService storeConfigService;

    @Inject
    LoginService loginService;

    @GET
    public List<StoreConfig> listStores() {
        return storeConfigService.listStores();
    }

    @POST
    public Response createStore(CreateStoreRequest request) {
        StoreConfig created = storeConfigService.createStore(
                request.nomeLoja, request.adminEmail, request.adminPassword);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @GET
    @Path("/{tenantId}")
    public StoreConfig getStore(@PathParam("tenantId") String tenantId) {
        return storeConfigService.getConfiguration(tenantId);
    }

    @PUT
    @Path("/{tenantId}")
    public StoreConfig updateStore(@PathParam("tenantId") String tenantId, StoreConfigUpdateRequest changes) {
        return storeConfigService.saveConfiguration(tenantId, changes);
    }

    @PATCH
    @Path("/{tenantId}/status")
    public StoreConfig updateStoreStatus(@PathParam("tenantId") String tenantId, StoreStatusRequest request) {
        return storeConfigService.setStoreActive(tenantId, request.ativa);
    }

    @POST
    @Path("/{tenantId}/acessar")
    public Map<String, String> accessStore(@PathParam("tenantId") String tenantId) {
        StoreConfig store = storeConfigService.getConfiguration(tenantId);
        String token = loginService.issueImpersonationToken(tenantId, jwt.getName());
        return Map.of("token", token, "nomeLoja", store.nomeLoja);
    }
}
