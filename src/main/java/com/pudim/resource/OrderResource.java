package com.pudim.resource;

import com.pudim.dto.OrderResponse;
import com.pudim.dto.UpdateOrderStatusRequest;
import com.pudim.service.OrderService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.List;

@Path("/api/admin/pedidos")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("admin")
public class OrderResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    OrderService orderService;

    /**
     * Listar pedidos com filtros
     */
    @GET
    public Response listOrders(
            @QueryParam("status") String status,
            @QueryParam("cliente") String cliente,
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("pageSize") @DefaultValue("20") int pageSize
    ) {
        List<OrderResponse> orders = orderService.listOrders(getTenantId(), status, cliente, page, pageSize);
        long total = orderService.countOrders(getTenantId(), status);
        
        return Response.ok()
                .header("X-Total-Count", total)
                .header("X-Page", page)
                .header("X-Page-Size", pageSize)
                .entity(orders)
                .build();
    }

    /**
     * Obter detalhes de um pedido
     */
    @GET
    @Path("/{id}")
    public OrderResponse getOrder(@PathParam("id") Long id) {
        return orderService.getOrder(getTenantId(), id);
    }

    /**
     * Atualizar status do pedido
     */
    @PATCH
    @Path("/{id}/status")
    public Response updateOrderStatus(
            @PathParam("id") Long id,
            UpdateOrderStatusRequest request
    ) {
        OrderResponse updated = orderService.updateOrderStatus(getTenantId(), id, request);
        return Response.ok(updated).build();
    }

    /**
     * Cancelar pedido
     */
    @DELETE
    @Path("/{id}")
    public Response cancelOrder(
            @PathParam("id") Long id,
            @QueryParam("motivo") String motivo
    ) {
        orderService.cancelarPedido(getTenantId(), id, motivo);
        return Response.noContent().build();
    }

    /**
     * Obter histórico de status de um pedido
     */
    @GET
    @Path("/{id}/historico")
    public Response getOrderStatusHistory(@PathParam("id") Long id) {
        var history = orderService.getOrderStatusHistory(getTenantId(), id);
        return Response.ok(history).build();
    }

    private String getTenantId() {
        return jwt.getClaim("tenant_id");
    }
}
