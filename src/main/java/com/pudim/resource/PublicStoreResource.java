package com.pudim.resource;

import com.pudim.dto.CreateOrderRequest;
import com.pudim.dto.OrderResponse;
import com.pudim.dto.PublicMenuResponse;
import com.pudim.service.PublicStoreService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
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
    PublicStoreService publicStoreService;

    @GET
    @Path("/{slug}/cardapio")
    public PublicMenuResponse getPublicMenu(@PathParam("slug") String slug) {
        return publicStoreService.getMenu(slug);
    }

    @GET
    @Path("/{slug}/pedidos")
    public List<OrderResponse> getPublicOrders(@PathParam("slug") String slug,
                                               @QueryParam("whatsapp") String whatsapp) {
        return publicStoreService.getOrdersTracking(slug, whatsapp);
    }

    @POST
    @Path("/{slug}/pedidos")
    public Response createPublicOrder(@PathParam("slug") String slug, @Valid CreateOrderRequest request) {
        OrderResponse created = publicStoreService.createOrder(slug, request);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @POST
    @Path("/{slug}/pagamentos/infinitepay/webhook")
    public Response infinitePayWebhook(@PathParam("slug") String slug, Map<String, Object> payload) {
        publicStoreService.receberWebhookInfinitePay(slug, payload);
        return Response.ok().build();
    }
}
