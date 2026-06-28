package com.findacorp.profile.dto;

import com.findacorp.profile.domain.Corp;
import com.findacorp.profile.domain.CorpAllianceHistory;
import com.findacorp.profile.domain.CorpEnriched;
import com.findacorp.profile.domain.CorpMember;
import com.findacorp.profile.domain.CorpMemberEvent;
import com.findacorp.profile.domain.CorpMemberSnapshot;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CorpProfileResponse(
    Long corpId,
    String name,
    String ticker,
    String faction,
    String tagline,
    String pitch,
    List<String> requirements,
    List<String> content,
    Corp.CorpStatus status,
    List<String> rolesLooking,
    List<String> languages,
    List<Integer> tzHours,
    List<Long> hrIds,
    LocalDateTime updatedAt,
    // enriched fields (nullable)
    Integer members,
    Integer capacity,
    String alliance,
    Integer founded,
    Integer killsLast30,
    BigDecimal efficiency,
    Long ceoId,
    Boolean ceoLoginRequired,
    LocalDateTime lastSyncedAt,
    // history
    List<AllianceEntry> allianceHistory,
    List<MemberSnapshot> memberHistory,
    // roster & member events
    List<MemberEntry> roster,
    List<MemberEventEntry> memberEvents
) {
    public record AllianceEntry(Long allianceId, String allianceName, String startDate, String endDate) {}
    public record MemberSnapshot(Integer members, LocalDateTime snappedAt) {}
    public record MemberEntry(Long characterId, String characterName) {}
    public record MemberEventEntry(Long characterId, String characterName, String eventType, LocalDateTime occurredAt) {}

    public static CorpProfileResponse from(Corp corp, CorpEnriched enriched,
                                           List<CorpAllianceHistory> allianceHistory,
                                           List<CorpMemberSnapshot> memberHistory,
                                           List<CorpMember> roster,
                                           List<CorpMemberEvent> memberEvents) {
        return new CorpProfileResponse(
            corp.getCorpId(), corp.getName(), corp.getTicker(), corp.getFaction(),
            corp.getTagline(), corp.getPitch(), corp.getRequirements(),
            corp.getContent(), corp.getStatus(),
            corp.getRolesLooking(), corp.getLanguages(), corp.getTzHours(),
            corp.getHrIds(), corp.getUpdatedAt(),
            enriched != null ? enriched.getMembers() : null,
            enriched != null ? enriched.getCapacity() : null,
            enriched != null ? enriched.getAlliance() : null,
            enriched != null ? enriched.getFounded() : null,
            enriched != null ? enriched.getKillsLast30() : null,
            enriched != null ? enriched.getEfficiency() : null,
            enriched != null ? enriched.getCeoId() : null,
            enriched != null && Boolean.TRUE.equals(enriched.getCeoLoginRequired()),
            enriched != null ? enriched.getLastSyncedAt() : null,
            allianceHistory.stream()
                .map(h -> new AllianceEntry(h.getAllianceId(), h.getAllianceName(), h.getStartDate(), h.getEndDate()))
                .toList(),
            memberHistory.stream()
                .map(s -> new MemberSnapshot(s.getMembers(), s.getSnappedAt()))
                .toList(),
            roster.stream()
                .map(m -> new MemberEntry(m.getCharacterId(), m.getCharacterName()))
                .toList(),
            memberEvents.stream()
                .map(e -> new MemberEventEntry(e.getCharacterId(), e.getCharacterName(), e.getEventType(), e.getOccurredAt()))
                .toList()
        );
    }
}
