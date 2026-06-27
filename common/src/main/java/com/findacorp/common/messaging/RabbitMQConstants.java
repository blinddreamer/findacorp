package com.findacorp.common.messaging;

public final class RabbitMQConstants {

    private RabbitMQConstants() {}

    public static final String ENRICHMENT_EXCHANGE   = "findacorp.enrichment";
    public static final String PILOT_ENRICHED_QUEUE  = "profile.pilot.enriched";
    public static final String CORP_ENRICHED_QUEUE   = "profile.corp.enriched";
    public static final String PILOT_ENRICHED_KEY    = "pilot.enriched";
    public static final String CORP_ENRICHED_KEY     = "corp.enriched";
    public static final String DLX_EXCHANGE          = "findacorp.enrichment.dlx";
}
