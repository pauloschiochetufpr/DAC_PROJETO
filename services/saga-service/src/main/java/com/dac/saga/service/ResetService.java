package com.dac.saga.service;

import com.dac.saga.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class ResetService {

    private static final String EVENTO_RESET = "reset";
    private static final boolean CONSUMIDORES_REBOOT_IMPLEMENTADOS = false;
    private static final String MOTIVO_CONSUMIDORES_AUSENTES =
        "Consumidores Rabbit de reboot ainda nao implementados nos servicos: " +
        "cliente-service, gerente-service, conta-service, auth-service";

    private final RabbitTemplate rabbitTemplate;

    public ResetService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void solicitarResetOrquestrado() {
        if (!CONSUMIDORES_REBOOT_IMPLEMENTADOS) {
            throw new IllegalStateException(MOTIVO_CONSUMIDORES_AUSENTES);
        }

        rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_RESET, EVENTO_RESET);
        System.out.println("Saga: solicitacao de reset publicada na fila " + RabbitMQConfig.FILA_RESET);
    }

    @RabbitListener(queues = RabbitMQConfig.FILA_RESET)
    public void executarReset(String mensagem) {
        if (mensagem == null || mensagem.isBlank()) {
            throw new IllegalArgumentException("Mensagem de reset invalida: payload vazio");
        }

        if (!EVENTO_RESET.equalsIgnoreCase(mensagem.trim())) {
            throw new IllegalArgumentException("Mensagem de reset invalida: payload desconhecido '" + mensagem + "'");
        }

        executarResetOrquestrado();
    }

    public void executarResetOrquestrado() {
        if (!CONSUMIDORES_REBOOT_IMPLEMENTADOS) {
            throw new UnsupportedOperationException(
                "Reset orquestrado indisponivel: " + MOTIVO_CONSUMIDORES_AUSENTES
            );
        }

        System.out.println("Saga: reset geral iniciado via mensageria RabbitMQ.");
    }
}