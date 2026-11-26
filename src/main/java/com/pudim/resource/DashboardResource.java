package com.pudim.resource;

import com.pudim.dto.DashboardResponse;
import com.pudim.service.DashboardService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Path("/api/admin/dashboard")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("admin")
public class DashboardResource {

    @Inject
    JsonWebToken jwt;

    @Inject
    DashboardService dashboardService;

    @GET
    public DashboardResponse getDashboard() {
        return dashboardService.getDashboard(jwt.getClaim("tenant_id"));
    }
}
