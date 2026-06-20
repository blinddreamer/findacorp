package com.drydock.profile.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "corp_enriched")
@Getter @Setter
public class CorpEnriched {

    @Id
    @Column(name = "corp_id")
    private Long corpId;

    private Integer members;

    private Integer capacity;

    @Column(length = 255)
    private String alliance;

    private Integer founded;

    @Column(name = "kills_last30")
    private Integer killsLast30;

    @Column(precision = 5, scale = 2)
    private BigDecimal efficiency;

    @Column(name = "ceo_id")
    private Long ceoId;

    /** True when the CEO changed but the new CEO hasn't logged in, so member sync is stalled. */
    @Column(name = "ceo_login_required")
    private Boolean ceoLoginRequired = false;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;
}
