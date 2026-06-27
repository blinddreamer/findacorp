package com.findacorp.collector.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "sync_targets")
@Data
@NoArgsConstructor
public class SyncTarget {

    @EmbeddedId
    private SyncTargetId id;

    @Column(name = "next_sync_at")
    private LocalDateTime nextSyncAt;

    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "sync_status")
    private SyncStatus syncStatus = SyncStatus.PENDING;
}
