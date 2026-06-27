package com.findacorp.profile.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pilot_corp_history")
@Getter @Setter @NoArgsConstructor
public class PilotCorpHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "character_id", nullable = false)
    private Long characterId;

    @Column(name = "corp_id")
    private Long corpId;

    @Column(name = "corp_name", length = 255)
    private String corpName;

    @Column(length = 255)
    private String alliance;

    @Column(name = "`from_date`", length = 10)
    private String fromDate;

    @Column(name = "`to_date`", length = 10)
    private String toDate;

    @Column(name = "duration_label", length = 50)
    private String durationLabel;

    public PilotCorpHistory(Long characterId, Long corpId, String corpName, String alliance,
                             String fromDate, String toDate, String durationLabel) {
        this.characterId = characterId;
        this.corpId = corpId;
        this.corpName = corpName;
        this.alliance = alliance;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.durationLabel = durationLabel;
    }
}
