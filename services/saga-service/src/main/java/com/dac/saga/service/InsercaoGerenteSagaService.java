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

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// InsercaoGerenteSagaService | orquestra a SAGA de Inserção de Gerente (R17).
// Etapas coordenadas pelo orquestrador:
//   1. MS Gerente: inserção do gerente (executada pelo próprio gerente-service, que dispara esta saga)
//   2. MS Conta: consultar o gerente com mais contas
//   3. MS Conta: atribuir uma conta ao novo gerente
@Service
public class InsercaoGerenteSagaService {

    @Value("${saga.services.conta}")
    private String contaUrl;

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public InsercaoGerenteSagaService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void executar(String novoGerenteCpf, String novoGerenteNome) {
        if (novoGerenteCpf == null || novoGerenteCpf.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF do novo gerente obrigatório");
        }

        publicarEvento("insercao_gerente.iniciada", novoGerenteCpf);

        try {
            // Etapa MS Conta (consulta): contagem de contas por gerente
            String contagemJson = SagaHttp.get(contaUrl + "/contas/contagem-por-gerente");
            Map<String, Long> contagem = objectMapper.readValue(
                contagemJson, new TypeReference<Map<String, Long>>() {});

            if (contagem.isEmpty()) {
                publicarEvento("insercao_gerente.concluida", novoGerenteCpf);
                return;
            }

            long maxContas = contagem.values().stream().mapToLong(Long::longValue).max().orElse(0);

            // Primeiro/único gerente com no máximo uma conta: novo gerente fica sem contas
            if (maxContas <= 1 && contagem.size() == 1) {
                publicarEvento("insercao_gerente.concluida", novoGerenteCpf);
                return;
            }

            // Gerente com mais contas; em caso de empate, ordem natural do CPF
            List<String> candidatos = contagem.entrySet().stream()
                .filter(e -> e.getValue() == maxContas)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

            String gerenteOrigem = candidatos.size() == 1
                ? candidatos.get(0)
                : candidatos.stream().min(Comparator.naturalOrder()).orElse(candidatos.get(0));

            // Etapa MS Conta: atribuir 1 conta do gerente de origem ao novo gerente
            Map<String, Object> body = new HashMap<>();
            body.put("gerenteOrigemCpf", gerenteOrigem);
            body.put("gerenteDestinoCpf", novoGerenteCpf);
            body.put("gerenteDestinoNome", novoGerenteNome);
            body.put("quantidade", 1);
            SagaHttp.post(contaUrl + "/contas/redistribuir", objectMapper.writeValueAsString(body));

            publicarEvento("insercao_gerente.concluida", novoGerenteCpf);
            System.out.println("Saga inserção de gerente: 1 conta redistribuída de "
                + gerenteOrigem + " para " + novoGerenteCpf);
        } catch (ResponseStatusException e) {
            publicarEvento("insercao_gerente.falha", novoGerenteCpf);
            throw e;
        } catch (Exception e) {
            publicarEvento("insercao_gerente.falha", novoGerenteCpf);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Falha na saga de inserção de gerente: " + e.getMessage(), e);
        }
    }

    private void publicarEvento(String routingKey, String gerenteCpf) {
        try {
            Map<String, Object> evento = new HashMap<>();
            evento.put("saga", "insercao_gerente");
            evento.put("gerenteCpf", gerenteCpf);
            rabbitTemplate.convertAndSend(RabbitMQConfig.SAGA_EXCHANGE, routingKey, evento);
        } catch (Exception ignored) {
            // publicação de evento de acompanhamento é best-effort
        }
    }
}
