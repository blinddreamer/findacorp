package com.findacorp.profile.dto;

import com.findacorp.profile.domain.Corp;
import com.findacorp.profile.domain.CorpEnriched;

import java.math.BigDecimal;
import java.util.List;

public record CorpSearchResult(
    Long corpId,
    String name,
    String ticker,
    String faction,
    String tagline,
    Corp.CorpStatus status,
    List<String> content,
    String tz,
    Long minSp,
    Integer members,
    String alliance,
    BigDecimal efficiency
) {
    public static CorpSearchResult from(Corp c, CorpEnriched e) {
        return new CorpSearchResult(
            c.getCorpId(), c.getName(), c.getTicker(), c.getFaction(),
            c.getTagline(), c.getStatus(), c.getContent(),
            c.getTz(), c.getMinSp(),
            e != null ? e.getMembers() : null,
            e != null ? e.getAlliance() : null,
            e != null ? e.getEfficiency() : null
        );
    }
}
