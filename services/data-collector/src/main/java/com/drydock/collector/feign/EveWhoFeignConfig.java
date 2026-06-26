package com.drydock.collector.feign;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;

/**
 * EVE Who asks third-party clients for a descriptive User-Agent (so they can contact the
 * operator) and expects respectful, low-rate access. Mirrors {@link ZKillFeignConfig}.
 */
public class EveWhoFeignConfig {

    @Bean
    public RequestInterceptor eveWhoHeadersInterceptor() {
        return template -> {
            template.header("User-Agent", "DRYDOCK EVE Recruiter / drydock-app / contact: admin@drydock.app");
            template.header("Accept", "application/json");
        };
    }
}
