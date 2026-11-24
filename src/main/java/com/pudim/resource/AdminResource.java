package com.pudim.resource;

import com.pudim.model.Product;
import com.pudim.model.ProductStatusRequest;
import com.pudim.model.StockAdjustmentRequest;
import com.pudim.model.StoreConfig;
import com.pudim.service.ProductService;
import com.pudim.service.StoreConfigService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
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
    public StoreConfig updateStoreConfig(StoreConfig changes) {
        return storeConfigService.saveConfiguration(getTenantId(), changes);
    }

    private String getTenantId() {
        return jwt.getClaim("tenant_id");
    }
}
