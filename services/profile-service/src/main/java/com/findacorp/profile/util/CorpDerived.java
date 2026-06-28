package com.findacorp.profile.util;

import java.util.List;

/**
 * Derives the queryable values (prime-time TZ, minimum SP) from a corp's raw JSON fields
 * (tz_hours, requirements). Computed once at write time and stored on the corp so search
 * can filter them in SQL. See docs/search-db-pagination-spec.md.
 */
public final class CorpDerived {

    private CorpDerived() {}

    /** Bucket a corp's active hours into an EVE prime-time TZ (mirrors the frontend inferTz). */
    public static String inferTz(List<Integer> hours) {
        if (hours == null || hours.isEmpty()) return null;
        long eu = hours.stream().filter(h -> h >= 16 && h <= 23).count();
        long us = hours.stream().filter(h -> h >= 0 && h <= 7).count();
        long au = hours.size() - eu - us;
        if (eu >= us && eu >= au) return "EU";
        if (us >= eu && us >= au) return "US";
        return "AU";
    }

    /** Find a declared minimum-SP requirement (in raw SP), matching on the label before the colon. */
    public static Long parseMinSp(List<String> requirements) {
        if (requirements == null) return null;
        for (String raw : requirements) {
            String r = stripOptionalMarker(raw);
            int idx = r.indexOf(':');
            if (idx < 0) continue;
            if (isSpLabel(r.substring(0, idx))) {
                Long v = parseSpValue(r.substring(idx + 1));
                if (v != null) return v;
            }
        }
        return null;
    }

    /**
     * Drop the trailing "(optional)" marker the frontend appends to optional requirements,
     * so SP parsing works whether the requirement is mandatory or optional.
     */
    private static String stripOptionalMarker(String r) {
        if (r == null) return "";
        return r.replaceFirst("(?i)\\s*\\(optional\\)\\s*$", "");
    }

    /** True for labels like "SP", "Minimum SP", "Min SP", "Skill Points" — but not "Response time". */
    private static boolean isSpLabel(String label) {
        String l = label.trim().toLowerCase();
        if (l.contains("skill")) return true;
        for (String token : l.split("\\s+")) {
            if (token.equals("sp")) return true;
        }
        return false;
    }

    /** Parse an SP value tolerant of commas and K/M/B suffixes ("25M", "25,000,000", "25000000"). */
    private static Long parseSpValue(String s) {
        if (s == null) return null;
        String t = s.replace(",", "").trim().toUpperCase();
        if (t.isEmpty()) return null;
        double mult = 1;
        char last = t.charAt(t.length() - 1);
        if (last == 'M') { mult = 1_000_000; t = t.substring(0, t.length() - 1); }
        else if (last == 'B') { mult = 1_000_000_000; t = t.substring(0, t.length() - 1); }
        else if (last == 'K') { mult = 1_000; t = t.substring(0, t.length() - 1); }
        try {
            return (long) (Double.parseDouble(t.trim()) * mult);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
