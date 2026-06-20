package com.drydock.collector.feign;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;

public class ZKillFeignConfig {

    @Bean
    public RequestInterceptor zkillHeadersInterceptor() {
        return template -> {
            template.header("User-Agent", "DRYDOCK EVE Recruiter / drydock-app / contact: admin@drydock.app");
            template.header("Accept", "application/json");
        };
    }
}
