package com.pudim.resource;

import com.pudim.model.Order;
import com.pudim.model.PublicMenuResponse;
import com.pudim.model.CreateOrderRequest;
import com.pudim.model.OrderResponse;
import com.pudim.service.PublicStoreService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/loja")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PublicStoreResource {

    @Inject
    PublicStoreService publicStoreService;

    @GET
    @Path("/{slug}/cardapio")
    public PublicMenuResponse getPublicMenu(@PathParam("slug") String slug) {
        return publicStoreService.getMenu(slug);
    }

    @POST
    @Path("/{slug}/pedidos")
    public Response createPublicOrder(@PathParam("slug") String slug, @Valid CreateOrderRequest request) {
        OrderResponse created = publicStoreService.createOrder(slug, request);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }
}
