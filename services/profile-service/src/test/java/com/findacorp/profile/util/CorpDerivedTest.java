package com.findacorp.profile.util;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CorpDerivedTest {

    @Test
    void inferTz_bucketsByActiveHours() {
        assertThat(CorpDerived.inferTz(List.of(18, 19, 20, 21))).isEqualTo("EU");
        assertThat(CorpDerived.inferTz(List.of(0, 1, 2, 3))).isEqualTo("US");
        assertThat(CorpDerived.inferTz(List.of(9, 10, 11, 12))).isEqualTo("AU");
    }

    @Test
    void inferTz_returnsNullForEmptyOrNull() {
        assertThat(CorpDerived.inferTz(null)).isNull();
        assertThat(CorpDerived.inferTz(List.of())).isNull();
    }

    @Test
    void parseMinSp_handlesSuffixesAndSeparators() {
        assertThat(CorpDerived.parseMinSp(List.of("Minimum SP: 25M"))).isEqualTo(25_000_000L);
        assertThat(CorpDerived.parseMinSp(List.of("SP: 25,000,000"))).isEqualTo(25_000_000L);
        assertThat(CorpDerived.parseMinSp(List.of("SP: 25000000"))).isEqualTo(25_000_000L);
        assertThat(CorpDerived.parseMinSp(List.of("Skill Points: 5M"))).isEqualTo(5_000_000L);
        assertThat(CorpDerived.parseMinSp(List.of("Min SP: 1.5B"))).isEqualTo(1_500_000_000L);
    }

    @Test
    void parseMinSp_ignoresNonSpRequirements() {
        assertThat(CorpDerived.parseMinSp(List.of("Response time: 2h", "Voice: required"))).isNull();
        assertThat(CorpDerived.parseMinSp(List.of("SP without colon"))).isNull();
        assertThat(CorpDerived.parseMinSp(List.of("SP: notanumber"))).isNull();
        assertThat(CorpDerived.parseMinSp(null)).isNull();
    }

    @Test
    void parseMinSp_picksFirstMatchingRequirement() {
        assertThat(CorpDerived.parseMinSp(List.of("Voice: yes", "Minimum SP: 10M", "SP: 20M")))
            .isEqualTo(10_000_000L);
    }
}
