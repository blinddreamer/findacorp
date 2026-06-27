package com.findacorp.profile.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "corp_alliance_history")
@Getter @Setter
public class CorpAllianceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "corp_id", nullable = false)
    private Long corpId;

    @Column(name = "alliance_id")
    private Long allianceId;

    @Column(name = "alliance_name", length = 255)
    private String allianceName;

    @Column(name = "start_date", length = 30)
    private String startDate;

    @Column(name = "end_date", length = 30)
    private String endDate;
}
