package com.drydock.profile.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "corp_members")
@Getter @Setter
public class CorpMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "corp_id", nullable = false)
    private Long corpId;

    @Column(name = "character_id", nullable = false)
    private Long characterId;

    @Column(name = "character_name", length = 255)
    private String characterName;
}
