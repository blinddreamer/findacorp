package com.findacorp.profile.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.Map;

@FeignClient(name = "data-collector")
public interface DataCollectorClient {

    @PostMapping("/internal/sync/corp/{corpId}")
    Map<String, String> syncCorp(@PathVariable("corpId") Long corpId);

    @PostMapping("/internal/sync/register/corp/{corpId}")
    Map<String, String> registerCorp(@PathVariable("corpId") Long corpId);
}
