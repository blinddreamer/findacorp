package com.findacorp.profile.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "corp_member_snapshots")
@Getter @Setter
public class CorpMemberSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "corp_id", nullable = false)
    private Long corpId;

    private Integer members;

    @Column(name = "snapped_at", nullable = false)
    private LocalDateTime snappedAt;
}
