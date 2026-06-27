package com.findacorp.application.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A conversation. Depending on {@link ThreadType} it is a pilot application, a direct
 * recruiting DM, or a system notification. The participating characters (and which side
 * they are on) live in {@link ThreadParticipant}; the body lives in {@link ThreadMessage}.
 */
@Entity
@Table(name = "threads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageThread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ThreadType type;

    @Enumerated(EnumType.STRING)
    @Column
    private ApplicationDirection direction;

    @Column(name = "pilot_id")
    private Long pilotId;

    @Column(name = "corp_id")
    private Long corpId;

    @Column(name = "pilot_name", length = 255)
    private String pilotName;

    @Column(name = "corp_name", length = 255)
    private String corpName;

    @Column(name = "corp_ticker", length = 20)
    private String corpTicker;

    @Column(length = 255)
    private String subject;

    /** Only meaningful for APPLICATION threads; null for DIRECT/SYSTEM. */
    @Enumerated(EnumType.STRING)
    @Column
    private ApplicationStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
