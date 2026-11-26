package com.pudim.resource;

import com.pudim.dto.CompradorProdutoResponse;
import com.pudim.service.RelatorioService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.List;

@Path("/api/admin/relatorios")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("admin")
public class RelatorioResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    RelatorioService relatorioService;

    @GET
    @Path("/compradores")
    public List<CompradorProdutoResponse> compradores(@QueryParam("produtoId") Long produtoId) {
        return relatorioService.compradoresPorProduto(jwt.getClaim("tenant_id"), produtoId);
    }
}
