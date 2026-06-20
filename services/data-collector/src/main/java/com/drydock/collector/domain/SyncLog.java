package com.drydock.collector.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "sync_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SyncLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_id")
    private Long entityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type")
    private EntityType entityType;

    @Column(name = "synced_at")
    private LocalDateTime syncedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "source")
    private SyncSource source;

    @Column(name = "success")
    private Boolean success;

    @Column(name = "error_msg", columnDefinition = "TEXT")
    private String errorMsg;
}
