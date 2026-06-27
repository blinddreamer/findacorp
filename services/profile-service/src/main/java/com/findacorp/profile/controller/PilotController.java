package com.findacorp.profile.controller;

import com.findacorp.profile.dto.PilotProfileResponse;
import com.findacorp.profile.dto.UpdatePilotRequest;
import com.findacorp.profile.service.PilotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/profiles")
@RequiredArgsConstructor
public class PilotController {

    private final PilotService pilotService;

    @GetMapping("/pilot/{characterId}")
    public ResponseEntity<PilotProfileResponse> getProfile(@PathVariable("characterId") Long characterId) {
        return ResponseEntity.ok(pilotService.getProfile(characterId));
    }

    @DeleteMapping("/pilot/{characterId}")
    public ResponseEntity<Void> deletePilot(@PathVariable("characterId") Long characterId) {
        pilotService.deletePilot(characterId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/pilot")
    public ResponseEntity<PilotProfileResponse> upsertPilot(
            @RequestHeader("X-Character-Id") Long characterId,
            @RequestHeader(value = "X-Character-Name", required = false) String characterName,
            @RequestBody UpdatePilotRequest req) {
        return ResponseEntity.ok(pilotService.upsertPilot(characterId, characterName, req));
    }
}
