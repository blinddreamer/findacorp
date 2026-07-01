package com.findacorp.auth.controller;

import com.findacorp.auth.dto.CharacterInfoResponse;
import com.findacorp.auth.dto.RefreshRequest;
import com.findacorp.auth.dto.SendMailRequest;
import com.findacorp.auth.repository.UserRepository;
import com.findacorp.auth.service.AuthService;
import com.findacorp.auth.service.JwtService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final UserRepository userRepo;

    @GetMapping("/login")
    public void login(jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        // The authorize URL carries a single-use `state` + PKCE challenge, so this redirect
        // must never be cached by the browser or any proxy — otherwise a stale authorize URL
        // gets replayed (causing invalid_scope after scope changes, or expired-state failures).
        response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Expires", "0");
        response.sendRedirect(authService.buildLoginRedirectUrl());
    }

    @GetMapping("/callback")
    public ResponseEntity<Map<String, String>> callback(@RequestParam String code,
                                                        @RequestParam String state) {
        var result = authService.handleCallback(code, state);
        return ResponseEntity.ok(Map.of(
            "accessToken", result.accessJwt(),
            "refreshToken", result.refreshJwt()
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, String>> refresh(@RequestBody RefreshRequest req) {
        Claims claims = jwtService.validateAndParse(req.refreshToken());
        if (!"refresh".equals(claims.get("type"))) {
            return ResponseEntity.status(401).build();
        }
        Long charId = Long.parseLong(claims.getSubject());
        String name = claims.get("name", String.class);
        return ResponseEntity.ok(Map.of("accessToken", jwtService.issueAccess(charId, name)));
    }

    @PostMapping("/mail")
    public ResponseEntity<Void> sendMail(@RequestHeader("Authorization") String bearerToken,
                                         @RequestBody SendMailRequest req) {
        Claims claims = jwtService.validateAndParse(bearerToken.replace("Bearer ", ""));
        Long senderId = Long.parseLong(claims.getSubject());
        authService.sendEveMail(senderId, req.recipientId(), req.subject(), req.body());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(@RequestHeader("Authorization") String bearerToken) {
        Claims claims = jwtService.validateAndParse(bearerToken.replace("Bearer ", ""));
        Long charId = Long.parseLong(claims.getSubject());
        authService.deleteAccount(charId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String bearerToken) {
        // JWT is stateless — no server-side session to revoke.
        // EVE SSO tokens are intentionally kept so data-collector continues syncing after logout.
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<CharacterInfoResponse> me(@RequestHeader("Authorization") String bearerToken) {
        Claims claims = jwtService.validateAndParse(bearerToken.replace("Bearer ", ""));
        return ResponseEntity.ok(new CharacterInfoResponse(
            Long.parseLong(claims.getSubject()),
            claims.get("name", String.class)
        ));
    }

    // Internal endpoint consumed by Data Collector to fetch fresh EVE access tokens
    @GetMapping("/token/{characterId}")
    public ResponseEntity<String> getEveToken(@PathVariable Long characterId) {
        try {
            return ResponseEntity.ok(authService.getFreshEveToken(characterId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
