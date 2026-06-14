package com.dac.saga.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String FILA_RESET = "saga.reset";
    public static final String SAGA_EXCHANGE = "saga.exchange";
    public static final String FILA_APROVAR = "saga.aprovar_cliente.queue";
    public static final String FILA_REJEITAR = "saga.rejeitar_cliente.queue";
    public static final String FILA_EMAIL_SEND = "email.send";

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
        return new TopicExchange("auth.exchange");
    }

    @Bean
    public Queue filaAprovar() {
        return new Queue(FILA_APROVAR, true);
    }

    @Bean
    public Queue filaRejeitar() {
        return new Queue(FILA_REJEITAR, true);
    }

    @Bean
    public Queue filaEmailSend() {
        return new Queue(FILA_EMAIL_SEND, true);
    }

    @Bean
    public Binding bindingAprovar(Queue filaAprovar, TopicExchange sagaExchange) {
        return BindingBuilder.bind(filaAprovar).to(sagaExchange).with("saga.aprovar_cliente");
    }

    @Bean
    public Binding bindingRejeitar(Queue filaRejeitar, TopicExchange sagaExchange) {
        return BindingBuilder.bind(filaRejeitar).to(sagaExchange).with("saga.rejeitar_cliente");
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
