package com.findacorp.profile.messaging;

import com.findacorp.common.events.CorpEnrichedEvent;
import com.findacorp.common.events.PilotEnrichedEvent;
import com.findacorp.common.messaging.RabbitMQConstants;
import com.findacorp.profile.service.CorpService;
import com.findacorp.profile.service.PilotService;
import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class EnrichmentListener {

    private final PilotService pilotService;
    private final CorpService corpService;

    @RabbitListener(queues = RabbitMQConstants.PILOT_ENRICHED_QUEUE)
    public void onPilotEnriched(PilotEnrichedEvent event, Channel channel, Message message)
            throws IOException {
        long tag = message.getMessageProperties().getDeliveryTag();
        try {
            pilotService.upsertEnrichment(event);
            channel.basicAck(tag, false);
            log.info("Pilot enrichment processed: characterId={}", event.characterId());
        } catch (Exception e) {
            log.error("Failed to process pilot enrichment for characterId={}: {}",
                event.characterId(), e.getMessage(), e);
            channel.basicNack(tag, false, false);
        }
    }

    @RabbitListener(queues = RabbitMQConstants.CORP_ENRICHED_QUEUE)
    public void onCorpEnriched(CorpEnrichedEvent event, Channel channel, Message message)
            throws IOException {
        long tag = message.getMessageProperties().getDeliveryTag();
        try {
            corpService.upsertEnrichment(event);
            channel.basicAck(tag, false);
            log.info("Corp enrichment processed: corpId={}", event.corpId());
        } catch (Exception e) {
            log.error("Failed to process corp enrichment for corpId={}: {}",
                event.corpId(), e.getMessage(), e);
            channel.basicNack(tag, false, false);
        }
    }
}
