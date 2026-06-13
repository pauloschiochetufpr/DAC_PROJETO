package com.dac.gerente.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
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

    public static final String FILA_RESET = "saga.reset";

    // Comando/resposta da saga (orquestrador -> gerente -> orquestrador)
    public static final String COMANDO_EXCHANGE     = "saga.comando";
    public static final String RESPOSTA_EXCHANGE    = "saga.resposta";
    public static final String FILA_COMANDO_GERENTE = "gerente.comando.queue";

    @Bean
    public Queue filaReset() {
        return new Queue(FILA_RESET, true);
    }

    @Bean
    public TopicExchange comandoExchange() {
        return new TopicExchange(COMANDO_EXCHANGE);
    }

    @Bean
    public TopicExchange respostaExchange() {
        return new TopicExchange(RESPOSTA_EXCHANGE);
    }

    @Bean
    public Queue filaComandoGerente() {
        return new Queue(FILA_COMANDO_GERENTE, true);
    }

    @Bean
    public Binding bindingComandoGerente(Queue filaComandoGerente, TopicExchange comandoExchange) {
        return BindingBuilder.bind(filaComandoGerente).to(comandoExchange).with("comando.gerente.#");
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