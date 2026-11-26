package com.pudim.resource;

import com.fasterxml.jackson.databind.JsonMappingException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

import java.util.Map;

@Provider
public class JsonParseExceptionMapper implements ExceptionMapper<JsonMappingException> {

    @Override
    public Response toResponse(JsonMappingException exception) {
        String fieldName = "unknown";
        if (exception.getPath() != null && !exception.getPath().isEmpty()) {
            fieldName = exception.getPath().get(0).getFieldName();
        }
        
        String message = "Erro ao processar campo '" + fieldName + "': " + exception.getOriginalMessage();
        
        return Response.status(Response.Status.BAD_REQUEST)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(Map.of("message", message))
                .build();
    }
}
