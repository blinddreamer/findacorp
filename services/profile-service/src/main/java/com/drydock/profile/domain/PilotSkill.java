package com.drydock.profile.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "pilot_skills")
@Getter @Setter @NoArgsConstructor
public class PilotSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "character_id", nullable = false)
    private Long characterId;

    @Column(name = "skill_name", length = 255)
    private String skillName;

    @Column(length = 255)
    private String category;

    private Byte level;

    private Long points;

    @Column(name = "learned_at")
    private LocalDateTime learnedAt;

    public PilotSkill(Long characterId, String skillName, int level, long points) {
        this.characterId = characterId;
        this.skillName = skillName;
        this.level = (byte) level;
        this.points = points;
    }
}
