package com.findacorp.collector.util;

import java.util.ArrayList;
import java.util.List;

/**
 * Pure functions that derive timezone / activity stats from a 7×24 (day-of-week × UTC-hour)
 * activity heatmap. Extracted from the enrichment pipeline so the logic is unit-testable in
 * isolation from ESI/zKillboard fetching.
 */
public final class TimezoneStats {

    private TimezoneStats() {}

    /** EVE prime-time bucket (EU / US / AU) inferred from the busiest UTC hour. */
    public static String detectTz(int[][] heatmap) {
        int[] hourly = hourlyTotals(heatmap);
        int peak = 0;
        for (int h = 1; h < 24; h++) {
            if (hourly[h] > hourly[peak]) peak = h;
        }
        if (peak >= 16 && peak <= 23) return "EU";
        if (peak >= 0 && peak <= 7) return "US";
        return "AU";
    }

    /** All UTC hours with any recorded activity, ascending. */
    public static List<Integer> activeHours(int[][] heatmap) {
        int[] hourly = hourlyTotals(heatmap);
        List<Integer> active = new ArrayList<>();
        for (int h = 0; h < 24; h++) {
            if (hourly[h] > 0) active.add(h);
        }
        return active;
    }

    /** Up to {@code limit} busiest UTC hours that have activity, busiest first. */
    public static List<Integer> peakHours(int[][] heatmap, int limit) {
        int[] hourly = hourlyTotals(heatmap);
        List<Integer> hours = new ArrayList<>();
        for (int h = 0; h < 24; h++) hours.add(h);
        hours.sort((a, b) -> hourly[b] - hourly[a]);
        return hours.subList(0, Math.min(limit, hours.size())).stream()
            .filter(h -> hourly[h] > 0)
            .toList();
    }

    private static int[] hourlyTotals(int[][] heatmap) {
        int[] hourly = new int[24];
        for (int[] day : heatmap) {
            for (int h = 0; h < 24; h++) hourly[h] += day[h];
        }
        return hourly;
    }
}
