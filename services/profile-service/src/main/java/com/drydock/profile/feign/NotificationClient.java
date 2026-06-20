package com.drydock.profile.feign;

import com.drydock.profile.dto.CeoChangeNotification;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "application-service")
public interface NotificationClient {

    @PostMapping("/internal/notifications/ceo-change")
    void notifyCeoChange(@RequestBody CeoChangeNotification req);
}
