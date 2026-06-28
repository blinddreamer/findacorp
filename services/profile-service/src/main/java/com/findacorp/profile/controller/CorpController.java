package com.findacorp.profile.controller;

import com.findacorp.profile.dto.CorpProfileResponse;
import com.findacorp.profile.dto.UpdateCorpRequest;
import com.findacorp.profile.feign.DataCollectorClient;
import com.findacorp.profile.service.CorpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/profiles")
@RequiredArgsConstructor
@Slf4j
public class CorpController {

    private final CorpService corpService;
    private final DataCollectorClient dataCollectorClient;

    /** When true, only a corp's CEO or appointed HR may edit its listing or trigger syncs. */
    @Value("${app.corp-edit-restricted:false}")
    private boolean corpEditRestricted;

    private void assertCanEdit(Long corpId, Long characterId) {
        if (!corpEditRestricted) return;
        // Bootstrap: until the corp has synced (CEO unknown), allow the listing to be created.
        if (!corpService.isCeoKnown(corpId)) return;
        if (!corpService.canEdit(corpId, characterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Only the corp CEO or appointed HR may edit this listing");
        }
    }

    @GetMapping("/corp/{corpId}")
    public ResponseEntity<CorpProfileResponse> getProfile(
            @PathVariable("corpId") Long corpId,
            @RequestHeader(value = "X-Character-Id", required = false) Long requesterId) {
        return ResponseEntity.ok(corpService.getProfile(corpId, requesterId));
    }

    @PutMapping("/corp/{corpId}")
    public ResponseEntity<CorpProfileResponse> upsertCorp(
            @PathVariable("corpId") Long corpId,
            @RequestHeader("X-Character-Id") Long characterId,
            @RequestBody UpdateCorpRequest req) {
        assertCanEdit(corpId, characterId);
        CorpProfileResponse response = corpService.upsertCorp(corpId, req);
        try {
            dataCollectorClient.registerCorp(corpId);
        } catch (Exception e) {
            log.warn("Could not register corp {} with data-collector: {}", corpId, e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/corp/{corpId}/sync")
    public ResponseEntity<Map<String, String>> requestSync(
            @PathVariable("corpId") Long corpId,
            @RequestHeader("X-Character-Id") Long characterId) {
        assertCanEdit(corpId, characterId);
        try {
            Map<String, String> result = dataCollectorClient.syncCorp(corpId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.warn("Corp sync request failed for {}: {}", corpId, e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("status", "failed", "error", e.getMessage()));
        }
    }
}
