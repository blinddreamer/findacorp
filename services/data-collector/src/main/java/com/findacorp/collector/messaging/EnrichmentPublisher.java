package com.findacorp.collector.messaging;

import com.findacorp.common.events.CorpEnrichedEvent;
import com.findacorp.common.events.PilotEnrichedEvent;
import com.findacorp.common.messaging.RabbitMQConstants;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EnrichmentPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishPilotEnriched(PilotEnrichedEvent event) {
        rabbitTemplate.convertAndSend(
            RabbitMQConstants.ENRICHMENT_EXCHANGE,
            RabbitMQConstants.PILOT_ENRICHED_KEY,
            event
        );
    }

    public void publishCorpEnriched(CorpEnrichedEvent event) {
        rabbitTemplate.convertAndSend(
            RabbitMQConstants.ENRICHMENT_EXCHANGE,
            RabbitMQConstants.CORP_ENRICHED_KEY,
            event
        );
    }
}
