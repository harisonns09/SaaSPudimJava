package com.pudim.resource;

import com.pudim.model.Order;
import com.pudim.model.Product;
import com.pudim.model.StoreConfig;
import com.pudim.multitenancy.TenantContext;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

@Path("/api/loja")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PublicStoreResource {

    @Inject
    TenantContext tenantContext;

    @GET
    @Path("/{slug}/cardapio")
    public Response getPublicMenu(@PathParam("slug") String slug) {
        StoreConfig config = StoreConfig.find("slug", slug).firstResult();
        if (config == null) {
            throw new WebApplicationException("Loja não encontrada", Response.Status.NOT_FOUND);
        }

        tenantContext.setTenantId(config.tenantId);

        List<Product> products = Product.list("ativo = true and estoqueAtual > 0");

        // Estrutura de resposta que o frontend espera
        Map<String, Object> response = Map.of(
                "loja", config,
                "produtos", products
        );

        return Response.ok(response).build();
    }

    @POST
    @Path("/{slug}/pedidos")
    @Transactional
    public Response createPublicOrder(@PathParam("slug") String slug, Order orderData) {
        StoreConfig config = StoreConfig.find("slug", slug).firstResult();
        if (config == null) {
            throw new WebApplicationException("Loja não encontrada", Response.Status.NOT_FOUND);
        }

        tenantContext.setTenantId(config.tenantId);
        orderData.tenantId = config.tenantId;
        // TODO: Lógica para calcular o valor total, gerar código do pedido, etc.
        orderData.persist();

        // TODO: Implementar o streaming de pedidos (SSE) para notificar a cozinha

        return Response.status(Response.Status.CREATED).entity(orderData).build();
    }
}
