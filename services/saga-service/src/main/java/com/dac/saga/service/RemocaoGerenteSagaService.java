package com.dac.saga.service;

import com.dac.saga.config.RabbitMQConfig;
import com.dac.saga.util.SagaHttp;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

// RemocaoGerenteSagaService | orquestra a SAGA de Remoção de Gerente (R18).
// Etapas coordenadas pelo orquestrador:
//   1. MS Gerente: consultar o gerente com menos contas (destino)
//   2. MS Conta: atribuição das contas ao novo gerente
//   3. MS Gerente: remoção do gerente (executada pelo gerente-service após esta saga)
@Service
public class RemocaoGerenteSagaService {

    @Value("${saga.services.conta}")
    private String contaUrl;

    @Value("${saga.services.gerente}")
    private String gerenteUrl;

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RemocaoGerenteSagaService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void executar(String gerenteRemovidoCpf) {
        if (gerenteRemovidoCpf == null || gerenteRemovidoCpf.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF do gerente a remover obrigatório");
        }

        publicarEvento("remocao_gerente.iniciada", gerenteRemovidoCpf);

        try {
            // Etapa MS Conta (consulta): contagem de contas por gerente
            String contagemJson = SagaHttp.get(contaUrl + "/contas/contagem-por-gerente");
            Map<String, Long> contagem = objectMapper.readValue(
                contagemJson, new TypeReference<Map<String, Long>>() {});

            contagem.remove(gerenteRemovidoCpf);

            // Sem outro gerente: nada a redistribuir
            if (contagem.isEmpty()) {
                publicarEvento("remocao_gerente.concluida", gerenteRemovidoCpf);
                return;
            }

            // Etapa MS Gerente (consulta): gerente com menos contas recebe as contas
            String gerenteDestinoCpf = contagem.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                    "Nenhum gerente disponível para redistribuição"));

            String gerenteDestinoNome = buscarNomeGerente(gerenteDestinoCpf);

            // Etapa MS Conta: reatribuir todas as contas do gerente removido ao destino
            Map<String, Object> body = new HashMap<>();
            body.put("gerenteOrigemCpf", gerenteRemovidoCpf);
            body.put("gerenteDestinoCpf", gerenteDestinoCpf);
            body.put("gerenteDestinoNome", gerenteDestinoNome);
            body.put("quantidade", -1);
            SagaHttp.post(contaUrl + "/contas/redistribuir", objectMapper.writeValueAsString(body));

            publicarEvento("remocao_gerente.concluida", gerenteRemovidoCpf);
            System.out.println("Saga remoção de gerente: contas de " + gerenteRemovidoCpf
                + " redistribuídas para " + gerenteDestinoCpf);
        } catch (ResponseStatusException e) {
            publicarEvento("remocao_gerente.falha", gerenteRemovidoCpf);
            throw e;
        } catch (Exception e) {
            publicarEvento("remocao_gerente.falha", gerenteRemovidoCpf);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Falha na saga de remoção de gerente: " + e.getMessage(), e);
        }
    }

    private String buscarNomeGerente(String cpf) {
        try {
            String json = SagaHttp.get(gerenteUrl + "/gerentes/" + cpf);
            Map<String, Object> gerente = objectMapper.readValue(
                json, new TypeReference<Map<String, Object>>() {});
            Object nome = gerente.get("nome");
            return nome != null ? nome.toString() : "";
        } catch (Exception e) {
            return "";
        }
    }

    private void publicarEvento(String routingKey, String gerenteCpf) {
        try {
            Map<String, Object> evento = new HashMap<>();
            evento.put("saga", "remocao_gerente");
            evento.put("gerenteCpf", gerenteCpf);
            rabbitTemplate.convertAndSend(RabbitMQConfig.SAGA_EXCHANGE, routingKey, evento);
        } catch (Exception ignored) {
            // publicação de evento de acompanhamento é best-effort
        }
    }
}
