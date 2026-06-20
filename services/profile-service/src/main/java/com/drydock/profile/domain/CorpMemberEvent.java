package com.drydock.profile.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "corp_member_events")
@Getter @Setter
public class CorpMemberEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "corp_id", nullable = false)
    private Long corpId;

    @Column(name = "character_id", nullable = false)
    private Long characterId;

    @Column(name = "character_name", length = 255)
    private String characterName;

    @Column(name = "event_type", length = 10, nullable = false)
    private String eventType; // "JOINED" | "LEFT"

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;
}
