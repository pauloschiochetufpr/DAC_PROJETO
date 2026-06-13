package com.dac.saga.service;

import com.dac.saga.config.RabbitMQConfig;
import com.dac.saga.util.SagaHttp;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

// AlteracaoPerfilSagaService | orquestra a SAGA de Alteração de Perfil (R4).
// Etapas coordenadas pelo orquestrador:
//   1. MS Cliente: alteração dos dados do cliente (executada pelo próprio cliente-service,
//      que dispara esta saga)
//   2. MS Conta: cálculo e alteração do novo limite da conta
@Service
public class AlteracaoPerfilSagaService {

    @Value("${saga.services.conta}")
    private String contaUrl;

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AlteracaoPerfilSagaService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void executar(String cpf, Double novoSalario) {
        if (cpf == null || cpf.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF obrigatório para alteração de perfil");
        }
        if (novoSalario == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Novo salário obrigatório para recálculo de limite");
        }

        publicarEvento("perfil.iniciada", cpf, novoSalario);

        // Etapa MS Conta: recalcular e atualizar o limite com base no novo salário.
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("clienteCpf", cpf);
            body.put("novoSalario", novoSalario);
            SagaHttp.put(contaUrl + "/contas/limite", objectMapper.writeValueAsString(body));
        } catch (Exception e) {
            publicarEvento("perfil.falha", cpf, novoSalario);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Falha ao atualizar limite da conta na saga de alteração de perfil: " + e.getMessage(), e);
        }

        publicarEvento("perfil.concluida", cpf, novoSalario);
        System.out.println("Saga alteração de perfil: limite recalculado para cliente " + cpf);
    }

    private void publicarEvento(String routingKey, String cpf, Double novoSalario) {
        try {
            Map<String, Object> evento = new HashMap<>();
            evento.put("saga", "alteracao_perfil");
            evento.put("cpf", cpf);
            evento.put("novoSalario", novoSalario);
            rabbitTemplate.convertAndSend(RabbitMQConfig.SAGA_EXCHANGE, routingKey, evento);
        } catch (Exception ignored) {
            // publicação de evento de acompanhamento é best-effort
        }
    }
}
