package com.drydock.collector.messaging;

import com.drydock.common.events.CorpEnrichedEvent;
import com.drydock.common.events.PilotEnrichedEvent;
import com.drydock.common.messaging.RabbitMQConstants;
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
