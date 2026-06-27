package com.findacorp.collector.util;

import java.util.Locale;

/** Formats raw ISK amounts into short human labels ("1.5B", "250.0M", "4.0K"). */
public final class IskFormat {

    private IskFormat() {}

    public static String format(double value) {
        // Locale.ROOT keeps a '.' decimal separator regardless of the host locale.
        if (value >= 1_000_000_000) return String.format(Locale.ROOT, "%.1fB", value / 1_000_000_000);
        if (value >= 1_000_000) return String.format(Locale.ROOT, "%.1fM", value / 1_000_000);
        if (value >= 1_000) return String.format(Locale.ROOT, "%.1fK", value / 1_000);
        return String.format(Locale.ROOT, "%.0f", value);
    }
}
