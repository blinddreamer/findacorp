package com.findacorp.profile.domain;

import com.findacorp.profile.util.IntegerListConverter;
import com.findacorp.profile.util.LongListConverter;
import com.findacorp.profile.util.StringListConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "corps")
@Getter @Setter
public class Corp {

    @Id
    @Column(name = "corp_id")
    private Long corpId;

    @Column(length = 255)
    private String name;

    @Column(length = 20)
    private String ticker;

    @Column(length = 20)
    private String faction;

    @Column(length = 500)
    private String tagline;

    @Column(columnDefinition = "TEXT")
    private String pitch;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> requirements = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> content = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(name = "roles_looking", columnDefinition = "JSON")
    private List<String> rolesLooking = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "JSON")
    private List<String> languages = new ArrayList<>();

    @Convert(converter = IntegerListConverter.class)
    @Column(name = "tz_hours", columnDefinition = "JSON")
    private List<Integer> tzHours = new ArrayList<>();

    @Convert(converter = LongListConverter.class)
    @Column(name = "hr_ids", columnDefinition = "JSON")
    private List<Long> hrIds = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('open','selective','closed')")
    private CorpStatus status = CorpStatus.open;

    // Denormalized derivations of tz_hours / requirements, kept current in upsertCorp so
    // search can filter them in SQL. See docs/search-db-pagination-spec.md.
    @Column(length = 5)
    private String tz;

    @Column(name = "min_sp")
    private Long minSp;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum CorpStatus { open, selective, closed }
}
