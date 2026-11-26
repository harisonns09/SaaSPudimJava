package com.pudim.resource;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.InputStream;
import java.net.URI;

@Path("/")
public class SpaFallbackResource {

    @ConfigProperty(name = "quarkus.quinoa.dev-server.port", defaultValue = "5173")
    int devServerPort;

    @Context
    UriInfo uriInfo;

    @GET
    @Path("/{slug}")
    @Produces(MediaType.TEXT_HTML)
    public Response loja(@PathParam("slug") String slug) {
        return servirSpa();
    }

    @GET
    @Path("/{slug}/pedido")
    @Produces(MediaType.TEXT_HTML)
    public Response pedido(@PathParam("slug") String slug) {
        return servirSpa();
    }

    @GET
    @Path("/admin/pedidos")
    @Produces(MediaType.TEXT_HTML)
    public Response adminPedidos() {
        return servirSpa();
    }

    @GET
    @Path("/admin/produtos")
    @Produces(MediaType.TEXT_HTML)
    public Response adminProdutos() {
        return servirSpa();
    }

    @GET
    @Path("/admin/configuracoes")
    @Produces(MediaType.TEXT_HTML)
    public Response adminConfiguracoes() {
        return servirSpa();
    }

    @GET
    @Path("/superadmin/login")
    @Produces(MediaType.TEXT_HTML)
    public Response superadminLogin() {
        return servirSpa();
    }

    private Response servirSpa() {
        InputStream index = Thread.currentThread().getContextClassLoader()
                .getResourceAsStream("META-INF/resources/index.html");
        if (index != null) {
            return Response.ok(index, MediaType.TEXT_HTML_TYPE).build();
        }
        // Em dev não há index.html empacotado: envia o navegador ao servidor Vite
        String path = uriInfo.getRequestUri().getRawPath();
        String query = uriInfo.getRequestUri().getRawQuery();
        String destino = "http://localhost:" + devServerPort + path + (query != null ? "?" + query : "");
        return Response.temporaryRedirect(URI.create(destino)).build();
    }
}
