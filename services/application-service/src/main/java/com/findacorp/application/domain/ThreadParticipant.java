package com.findacorp.application.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * A character's membership in a thread. The corp side of an application/DM is expanded
 * into one participant per CEO/HR character, so any of them can see and act on it.
 * {@code lastReadAt} drives unread tracking.
 */
@Entity
@Table(name = "thread_participants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThreadParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "thread_id", nullable = false)
    private Long threadId;

    @Column(name = "character_id", nullable = false)
    private Long characterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ParticipantSide side;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;
}
