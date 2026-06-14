package com.dac.saga.listener;

import com.dac.saga.config.RabbitMQConfig;
import com.dac.saga.service.AutocadastroSagaService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class AutocadastroSagaListener {

    private final AutocadastroSagaService autocadastroSagaService;

    public AutocadastroSagaListener(AutocadastroSagaService autocadastroSagaService) {
        this.autocadastroSagaService = autocadastroSagaService;
    }

    @RabbitListener(queues = RabbitMQConfig.FILA_APROVAR)
    public void aprovarCliente(Map<String, Object> evento) {
        autocadastroSagaService.processarAprovacao(evento);
    }

    @RabbitListener(queues = RabbitMQConfig.FILA_REJEITAR)
    public void rejeitarCliente(Map<String, Object> evento) {
        autocadastroSagaService.processarRejeicao(evento);
    }
}
