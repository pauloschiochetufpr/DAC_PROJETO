package com.dac.conta.config;

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

    public static final String FILA_RESET               = "saga.reset";
    public static final String FILA_CONTA_ATUALIZADA    = "conta.atualizada";
    public static final String FILA_MOVIMENTACAO_CRIADA = "conta.movimentacao.criada";
    public static final String FILA_LIMITE              = "conta.limite";

    // Comando/resposta da saga (orquestrador -> conta -> orquestrador)
    public static final String COMANDO_EXCHANGE   = "saga.comando";
    public static final String RESPOSTA_EXCHANGE  = "saga.resposta";
    public static final String FILA_COMANDO_CONTA = "conta.comando.queue";

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
    public Queue filaComandoConta() {
        return new Queue(FILA_COMANDO_CONTA, true);
    }

    @Bean
    public Binding bindingComandoConta(Queue filaComandoConta, TopicExchange comandoExchange) {
        return BindingBuilder.bind(filaComandoConta).to(comandoExchange).with("comando.conta.#");
    }

    @Bean
    public Queue filaContaAtualizada() {
        return new Queue(FILA_CONTA_ATUALIZADA, true);
    }

    @Bean
    public Queue filaMovimentacaoCriada() {
        return new Queue(FILA_MOVIMENTACAO_CRIADA, true);
    }

    @Bean
    public Queue filaLimite() {
        return new Queue(FILA_LIMITE, true);
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