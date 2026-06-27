package com.findacorp.collector.feign;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;

public class ZKillFeignConfig {

    @Bean
    public RequestInterceptor zkillHeadersInterceptor() {
        return template -> {
            template.header("User-Agent", "FINDACORP EVE Recruiter / findacorp-app / contact: admin@findacorp.app");
            template.header("Accept", "application/json");
        };
    }
}
