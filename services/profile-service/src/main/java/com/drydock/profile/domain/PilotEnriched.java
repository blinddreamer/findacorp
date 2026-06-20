package com.drydock.profile.domain;

import com.drydock.profile.util.IntMatrixConverter;
import com.drydock.profile.util.IntegerListConverter;
import com.drydock.profile.util.StringListConverter;
import com.drydock.profile.util.StringLongMapConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "pilot_enriched")
@Getter @Setter
public class PilotEnriched {

    @Id
    @Column(name = "character_id")
    private Long characterId;

    private Long sp;

    @Convert(converter = StringLongMapConverter.class)
    @Column(name = "sp_by_cat", columnDefinition = "JSON")
    private Map<String, Long> spByCat = new HashMap<>();

    @Column(length = 5)
    private String tz;

    @Convert(converter = IntegerListConverter.class)
    @Column(name = "tz_active", columnDefinition = "JSON")
    private List<Integer> tzActive = new ArrayList<>();

    @Convert(converter = IntegerListConverter.class)
    @Column(name = "tz_peak", columnDefinition = "JSON")
    private List<Integer> tzPeak = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> lang = new ArrayList<>();

    @Column(name = "kb_kills")
    private Integer kbKills;

    @Column(name = "kb_losses")
    private Integer kbLosses;

    @Column(name = "kb_efficiency", precision = 5, scale = 2)
    private BigDecimal kbEfficiency;

    @Column(name = "isk_destroyed")
    private Long iskDestroyed;

    @Convert(converter = IntMatrixConverter.class)
    @Column(columnDefinition = "JSON")
    private int[][] heatmap;

    @Convert(converter = StringListConverter.class)
    @Column(name = "skill_queue", columnDefinition = "JSON")
    private List<String> skillQueue = new ArrayList<>();

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;
}
