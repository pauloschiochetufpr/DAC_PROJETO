package com.dac.conta.listener;

import com.dac.conta.dto.request.AtualizarLimiteRequestDTO;
import com.dac.conta.service.ContaService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ClienteEventoListener {

    @Autowired
    private ContaService contaService;

    // Escuta evento publicado pelo cliente-service quando salário é alterado (R4)
    @RabbitListener(queues = "${rabbitmq.fila.limite:conta.limite}",
                    containerFactory = "rabbitListenerContainerFactory")
    public void onAtualizarLimite(Map<String, Object> evento) {
        try {
            String cpf = (String) evento.get("cpf");
            Object salarioObj = evento.get("novoSalario");

            if (cpf == null || salarioObj == null) {
                System.err.println("conta-service: evento de limite inválido - cpf ou salario nulos");
                return;
            }

            Double novoSalario = ((Number) salarioObj).doubleValue();

            AtualizarLimiteRequestDTO request = new AtualizarLimiteRequestDTO();
            request.setClienteCpf(cpf);
            request.setNovoSalario(novoSalario);

            contaService.atualizarLimite(request);
            System.out.println("conta-service: limite atualizado para cliente " + cpf);
        } catch (Exception e) {
            System.err.println("conta-service: erro ao atualizar limite - " + e.getMessage());
            throw e;
        }
    }
}