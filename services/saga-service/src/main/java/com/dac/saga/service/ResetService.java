package com.dac.saga.service;

import com.dac.saga.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class ResetService {

    private final RabbitTemplate rabbitTemplate;

    public ResetService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void solicitarResetOrquestrado() {
        rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_RESET, "reset");
        System.out.println("Saga: solicitacao de reset publicada na fila " + RabbitMQConfig.FILA_RESET);
    }
}