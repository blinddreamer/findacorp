package com.drydock.collector.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TimezoneStatsTest {

    private int[][] heatmapWith(int hour, int count) {
        int[][] hm = new int[7][24];
        hm[0][hour] = count;
        return hm;
    }

    @Test
    void detectTz_bucketsByBusiestHour() {
        assertThat(TimezoneStats.detectTz(heatmapWith(20, 5))).isEqualTo("EU");
        assertThat(TimezoneStats.detectTz(heatmapWith(3, 5))).isEqualTo("US");
        assertThat(TimezoneStats.detectTz(heatmapWith(12, 5))).isEqualTo("AU");
    }

    @Test
    void activeHours_returnsHoursWithActivityAscending() {
        int[][] hm = new int[7][24];
        hm[1][19] = 2;
        hm[0][8] = 1;
        assertThat(TimezoneStats.activeHours(hm)).containsExactly(8, 19);
    }

    @Test
    void peakHours_returnsBusiestFirstAndHonoursLimit() {
        int[][] hm = new int[7][24];
        hm[0][20] = 5;
        hm[0][18] = 3;
        hm[0][2] = 1;
        assertThat(TimezoneStats.peakHours(hm, 2)).containsExactly(20, 18);
        assertThat(TimezoneStats.peakHours(hm, 5)).containsExactly(20, 18, 2);
    }

    @Test
    void peakHours_excludesHoursWithNoActivity() {
        int[][] hm = new int[7][24];
        hm[0][20] = 5;
        assertThat(TimezoneStats.peakHours(hm, 5)).containsExactly(20);
    }
}
