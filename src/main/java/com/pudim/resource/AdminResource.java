package com.pudim.resource;

import com.pudim.dto.ProductStatusRequest;
import com.pudim.dto.StockAdjustmentRequest;
import com.pudim.dto.StoreConfigUpdateRequest;
import com.pudim.entity.Product;
import com.pudim.entity.StoreConfig;
import com.pudim.service.ProductService;
import com.pudim.service.StoreConfigService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.List;

@Path("/api/admin")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("admin")
public class AdminResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    ProductService productService;

    @Inject
    StoreConfigService storeConfigService;

    @GET
    @Path("/produtos")
    public List<Product> getProducts() {
        return productService.listProducts(getTenantId());
    }

    @POST
    @Path("/produtos")
    public Response createProduct(Product product) {
        Product created = productService.createProduct(getTenantId(), product);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/produtos/{id}")
    public Product updateProduct(@PathParam("id") Long id, Product changes) {
        return productService.updateProduct(getTenantId(), id, changes);
    }

    @PATCH
    @Path("/produtos/{id}")
    public Product updateProductStatus(
            @PathParam("id") Long id,
            ProductStatusRequest request
    ) {
        return productService.updateProductStatus(getTenantId(), id, request.ativo);
    }

    @PATCH
    @Path("/produtos/{id}/estoque")
    public Product adjustStock(
            @PathParam("id") Long id,
            StockAdjustmentRequest request
    ) {
        return productService.adjustStock(getTenantId(), id, request.delta);
    }

    @DELETE
    @Path("/produtos/{id}")
    public Response deleteProduct(@PathParam("id") Long id) {
        productService.deleteProduct(getTenantId(), id);
        return Response.noContent().build();
    }

    @GET
    @Path("/configuracoes")
    public StoreConfig getStoreConfig() {
        return storeConfigService.getConfiguration(getTenantId());
    }

    @PUT
    @Path("/configuracoes")
    public StoreConfig updateStoreConfig(StoreConfigUpdateRequest changes) {
        return storeConfigService.saveConfiguration(getTenantId(), changes);
    }

    private String getTenantId() {
        return jwt.getClaim("tenant_id");
    }
}
