package com.findacorp.auth.service;

import com.findacorp.auth.config.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessExpirySeconds;
    private final long refreshExpirySeconds;

    public JwtService(JwtProperties props) {
        byte[] keyBytes = Base64.getDecoder().decode(props.secret());
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.accessExpirySeconds = props.accessExpiryMinutes() * 60L;
        this.refreshExpirySeconds = props.refreshExpiryDays() * 86400L;
    }

    public String issueAccess(Long characterId, String characterName) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(String.valueOf(characterId))
            .claim("name", characterName)
            .claim("type", "access")
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(accessExpirySeconds)))
            .signWith(signingKey)
            .compact();
    }

    public String issueRefresh(Long characterId, String characterName) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(String.valueOf(characterId))
            .claim("name", characterName)
            .claim("type", "refresh")
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(refreshExpirySeconds)))
            .signWith(signingKey)
            .compact();
    }

    public Claims validateAndParse(String token) {
        return Jwts.parser()
            .verifyWith(signingKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }
}
