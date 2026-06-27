package com.findacorp.profile.domain;

import com.findacorp.profile.util.IntegerListConverter;
import com.findacorp.profile.util.StringListConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pilots")
@Getter @Setter
public class Pilot {

    @Id
    @Column(name = "character_id")
    private Long characterId;

    @Column(length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "looking_for", columnDefinition = "TEXT")
    private String lookingFor;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> roles = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> content = new ArrayList<>();

    @Column(length = 20)
    private String activity;

    @Column(length = 255)
    private String voice;

    private Boolean verified = false;

    @Convert(converter = IntegerListConverter.class)
    @Column(name = "manual_tz_active", columnDefinition = "JSON")
    private List<Integer> manualTzActive;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> languages = new ArrayList<>();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
