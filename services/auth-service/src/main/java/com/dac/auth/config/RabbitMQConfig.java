package com.dac.auth.config;

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
    public static final String AUTH_EXCHANGE = "auth.exchange";
    public static final String FILA_AUTH_CRIAR = "auth.criar.queue";
    public static final String FILA_AUTH_ATUALIZAR = "auth.atualizar.queue";
    public static final String FILA_AUTH_REMOVER = "auth.remover.queue";

    @Bean
    public Queue filaReset() {
        return new Queue(FILA_RESET, true);
    }

    @Bean
    public TopicExchange authExchange() {
        return new TopicExchange(AUTH_EXCHANGE);
    }

    @Bean
    public Queue filaAuthCriar() {
        return new Queue(FILA_AUTH_CRIAR, true);
    }

    @Bean
    public Queue filaAuthAtualizar() {
        return new Queue(FILA_AUTH_ATUALIZAR, true);
    }

    @Bean
    public Queue filaAuthRemover() {
        return new Queue(FILA_AUTH_REMOVER, true);
    }

    @Bean
    public Binding bindingCriar(Queue filaAuthCriar, TopicExchange authExchange) {
        return BindingBuilder.bind(filaAuthCriar).to(authExchange).with("auth.criar");
    }

    @Bean
    public Binding bindingAtualizar(Queue filaAuthAtualizar, TopicExchange authExchange) {
        return BindingBuilder.bind(filaAuthAtualizar).to(authExchange).with("auth.atualizar");
    }

    @Bean
    public Binding bindingRemover(Queue filaAuthRemover, TopicExchange authExchange) {
        return BindingBuilder.bind(filaAuthRemover).to(authExchange).with("auth.remover");
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