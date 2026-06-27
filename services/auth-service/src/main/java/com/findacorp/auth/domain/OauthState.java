package com.findacorp.auth.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "oauth_states")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OauthState {

    @Id
    @Column(name = "state", length = 128)
    private String state;

    @Column(name = "code_verifier", nullable = false, length = 256)
    private String codeVerifier;

    @Column(name = "redirect_uri", nullable = false, length = 512)
    private String redirectUri;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
