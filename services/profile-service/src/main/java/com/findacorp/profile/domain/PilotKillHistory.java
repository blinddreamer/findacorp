package com.findacorp.profile.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "pilot_kill_history")
@Getter @Setter @NoArgsConstructor
public class PilotKillHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "character_id", nullable = false)
    private Long characterId;

    @Column(columnDefinition = "ENUM('kill','loss')")
    private String kind;

    @Column(length = 255)
    private String ship;

    @Column(length = 255)
    private String system;

    @Column(length = 50)
    private String isk;

    @Column(name = "when_at")
    private LocalDateTime whenAt;

    @Column(name = "final_blow")
    private Boolean finalBlow;

    @Column(name = "victim_name", length = 255)
    private String victimName;

    @Column(name = "ship_type_id")
    private Integer shipTypeId;

    public PilotKillHistory(Long characterId, String kind, String ship, Integer shipTypeId,
                            String system, String isk, LocalDateTime whenAt, boolean finalBlow,
                            String victimName) {
        this.characterId = characterId;
        this.kind = kind;
        this.ship = ship;
        this.shipTypeId = shipTypeId;
        this.system = system;
        this.isk = isk;
        this.whenAt = whenAt;
        this.finalBlow = finalBlow;
        this.victimName = victimName;
    }
}
