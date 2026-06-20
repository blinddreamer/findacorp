package com.drydock.profile.config;

import com.drydock.common.messaging.RabbitMQConstants;
import org.springframework.amqp.core.*;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    @Bean
    TopicExchange enrichmentExchange() {
        return new TopicExchange(RabbitMQConstants.ENRICHMENT_EXCHANGE, true, false);
    }

    @Bean
    TopicExchange dlxExchange() {
        return new TopicExchange(RabbitMQConstants.DLX_EXCHANGE, true, false);
    }

    @Bean
    Queue pilotEnrichedQueue() {
        return QueueBuilder.durable(RabbitMQConstants.PILOT_ENRICHED_QUEUE)
            .withArgument("x-dead-letter-exchange", RabbitMQConstants.DLX_EXCHANGE)
            .build();
    }

    @Bean
    Queue corpEnrichedQueue() {
        return QueueBuilder.durable(RabbitMQConstants.CORP_ENRICHED_QUEUE)
            .withArgument("x-dead-letter-exchange", RabbitMQConstants.DLX_EXCHANGE)
            .build();
    }

    @Bean
    Binding pilotBinding(@Qualifier("pilotEnrichedQueue") Queue pilotEnrichedQueue,
                         @Qualifier("enrichmentExchange") TopicExchange enrichmentExchange) {
        return BindingBuilder.bind(pilotEnrichedQueue).to(enrichmentExchange)
            .with(RabbitMQConstants.PILOT_ENRICHED_KEY);
    }

    @Bean
    Binding corpBinding(@Qualifier("corpEnrichedQueue") Queue corpEnrichedQueue,
                        @Qualifier("enrichmentExchange") TopicExchange enrichmentExchange) {
        return BindingBuilder.bind(corpEnrichedQueue).to(enrichmentExchange)
            .with(RabbitMQConstants.CORP_ENRICHED_KEY);
    }

    @Bean
    Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            Jackson2JsonMessageConverter converter) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(converter);
        factory.setAcknowledgeMode(AcknowledgeMode.MANUAL);
        factory.setPrefetchCount(1);
        return factory;
    }
}
