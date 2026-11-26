package com.pudim.resource;

import com.pudim.exception.StoreInactiveException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.Map;

@Provider
public class StoreInactiveExceptionMapper implements ExceptionMapper<StoreInactiveException> {

    @Override
    public Response toResponse(StoreInactiveException exception) {
        return Response.status(Response.Status.FORBIDDEN)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(Map.of("message", exception.getMessage()))
                .build();
    }
}
