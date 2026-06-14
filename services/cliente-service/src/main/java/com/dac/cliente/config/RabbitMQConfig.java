package com.dac.cliente.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String FILA_RESET         = "saga.reset";
    public static final String SAGA_EXCHANGE      = "saga.exchange";
    public static final String AUTH_EXCHANGE      = "auth.exchange";
    public static final String FILA_SAGA_APROVAR  = "saga.aprovar_cliente";
    public static final String FILA_SAGA_REJEITAR = "saga.rejeitar_cliente";
    public static final String FILA_CONTA_LIMITE  = "conta.limite";
    public static final String FILA_AUTH_REMOVER  = "auth.remover";

    @Bean
    public Queue filaReset() {
        return new Queue(FILA_RESET, true);
    }

    @Bean
    public TopicExchange sagaExchange() {
        return new TopicExchange(SAGA_EXCHANGE);
    }

    @Bean
    public TopicExchange authExchange() {
        return new TopicExchange(AUTH_EXCHANGE);
    }

    @Bean
    public Queue filaSagaAprovar() {
        return new Queue(FILA_SAGA_APROVAR, true);
    }

    @Bean
    public Queue filaSagaRejeitar() {
        return new Queue(FILA_SAGA_REJEITAR, true);
    }

    @Bean
    public Queue filaContaLimite() {
        return new Queue(FILA_CONTA_LIMITE, true);
    }

    @Bean
    public Queue filaAuthRemover() {
        return new Queue(FILA_AUTH_REMOVER, true);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter());
        return factory;
    }
}
