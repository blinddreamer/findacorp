package com.findacorp.collector.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class IskFormatTest {

    @Test
    void format_scalesByMagnitude() {
        assertThat(IskFormat.format(1_500_000_000)).isEqualTo("1.5B");
        assertThat(IskFormat.format(2_000_000)).isEqualTo("2.0M");
        assertThat(IskFormat.format(5_000)).isEqualTo("5.0K");
        assertThat(IskFormat.format(500)).isEqualTo("500");
    }
}
