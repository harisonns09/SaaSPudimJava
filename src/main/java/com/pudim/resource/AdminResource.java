package com.pudim.resource;

import com.pudim.model.Product;
import com.pudim.model.StoreConfig;
import com.pudim.multitenancy.TenantContext;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.List;

@Path("/api/admin")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("admin") // Ativado! Agora todos os endpoints nesta classe exigem o papel "admin".
public class AdminResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    TenantContext tenantContext;

    // --- Endpoints de Produtos ---

    @GET
    @Path("/produtos")
    public List<Product> getProducts() {
        setTenantContext();
        return Product.listAll();
    }

    @POST
    @Path("/produtos")
    @Transactional
    public Response createProduct(Product product) {
        setTenantContext();
        product.tenantId = getTenantId();
        product.persist();
        return Response.status(Response.Status.CREATED).entity(product).build();
    }

    @PUT
    @Path("/produtos/{id}")
    @Transactional
    public Product updateProduct(@PathParam("id") Long id, Product productData) {
        setTenantContext();
        Product product = Product.findById(id);
        if (product == null) {
            throw new WebApplicationException("Produto não encontrado", Response.Status.NOT_FOUND);
        }
        product.nome = productData.nome;
        product.descricao = productData.descricao;
        product.precoVenda = productData.precoVenda;
        product.pesoGramas = productData.pesoGramas;
        product.estoqueAtual = productData.estoqueAtual;
        product.ativo = productData.ativo;
        product.persist();
        return product;
    }

    @DELETE
    @Path("/produtos/{id}")
    @Transactional
    public Response deleteProduct(@PathParam("id") Long id) {
        setTenantContext();
        Product.deleteById(id);
        return Response.noContent().build();
    }

    // --- Endpoints de Configurações da Loja ---

    @GET
    @Path("/configuracoes")
    public StoreConfig getStoreConfig() {
        setTenantContext();
        return StoreConfig.find("tenantId", getTenantId()).firstResult();
    }

    @PUT
    @Path("/configuracoes")
    @Transactional
    public StoreConfig updateStoreConfig(StoreConfig configData) {
        setTenantContext();
        StoreConfig config = StoreConfig.find("tenantId", getTenantId()).firstResult();
        if (config == null) {
            // Cria se não existir
            configData.tenantId = getTenantId();
            configData.persist();
            return configData;
        }
        config.nomeLoja = configData.nomeLoja;
        config.slug = configData.slug;
        config.subtitulo = configData.subtitulo;
        config.taxaEntregaPadrao = configData.taxaEntregaPadrao;
        config.abertaParaEncomendas = configData.abertaParaEncomendas;
        config.persist();
        return config;
    }

    private void setTenantContext() {
        tenantContext.setTenantId(getTenantId());
    }

    private String getTenantId() {
        return jwt.getClaim("tenant_id");
    }
}
