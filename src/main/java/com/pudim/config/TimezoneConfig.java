package com.pudim.config;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;

import java.util.TimeZone;

@ApplicationScoped
public class TimezoneConfig {

    public static final String FUSO_HORARIO = "America/Sao_Paulo";

    void onStart(@Observes StartupEvent event) {
        TimeZone.setDefault(TimeZone.getTimeZone(FUSO_HORARIO));
    }
}
