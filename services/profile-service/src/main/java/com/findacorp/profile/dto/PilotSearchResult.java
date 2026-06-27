package com.findacorp.profile.dto;

import com.findacorp.profile.domain.Pilot;
import com.findacorp.profile.domain.PilotEnriched;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PilotSearchResult(
    Long characterId,
    String name,
    Long sp,
    String tz,
    List<Integer> tzActive,
    List<Integer> tzPeak,
    List<String> roles,
    List<String> content,
    String activity,
    Integer kbKills,
    Integer kbLosses,
    BigDecimal kbEfficiency,
    LocalDateTime lastSyncedAt
) {
    public static PilotSearchResult from(Pilot p, PilotEnriched e) {
        return new PilotSearchResult(
            p.getCharacterId(), p.getName(),
            e != null ? e.getSp() : null,
            e != null ? e.getTz() : null,
            e != null ? e.getTzActive() : null,
            e != null ? e.getTzPeak() : null,
            p.getRoles(), p.getContent(), p.getActivity(),
            e != null ? e.getKbKills() : null,
            e != null ? e.getKbLosses() : null,
            e != null ? e.getKbEfficiency() : null,
            e != null ? e.getLastSyncedAt() : null
        );
    }
}
