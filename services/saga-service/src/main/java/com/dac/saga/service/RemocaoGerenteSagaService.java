package com.dac.saga.service;

import com.dac.saga.bus.RespostaComando;
import com.dac.saga.bus.SagaCommandBus;
import com.dac.saga.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

// RemocaoGerenteSagaService | orquestra a SAGA de Remoção de Gerente (R18).
// Comunicação com os serviços 100% assíncrona via RabbitMQ (comando/resposta).
// Etapas:
//   1. MS Conta/Gerente: consultar gerente com menos contas (destino)
//   2. MS Conta: atribuição das contas ao novo gerente
//   3. MS Gerente: remoção do gerente (gerente-service, após o sucesso desta saga)
@Service
public class RemocaoGerenteSagaService {

    private final RabbitTemplate rabbitTemplate;
    private final SagaCommandBus commandBus;

    public RemocaoGerenteSagaService(RabbitTemplate rabbitTemplate, SagaCommandBus commandBus) {
        this.rabbitTemplate = rabbitTemplate;
        this.commandBus = commandBus;
    }

    @SuppressWarnings("unchecked")
    public void executar(String gerenteRemovidoCpf) {
        if (gerenteRemovidoCpf == null || gerenteRemovidoCpf.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF do gerente a remover obrigatório");
        }

        publicarEvento("remocao_gerente.iniciada", gerenteRemovidoCpf);

        try {
            // Consulta MS Conta (comando): contagem de contas por gerente
            RespostaComando resp = commandBus.enviarEAguardar(
                "comando.conta.consultar-contagem", "consultar_contagem", new HashMap<>());
            Map<String, Object> contagemRaw = resp.getDados() != null
                ? (Map<String, Object>) resp.getDados().getOrDefault("contagem", new HashMap<>())
                : new HashMap<>();

            Map<String, Long> contagem = new HashMap<>();
            contagemRaw.forEach((k, v) -> contagem.put(k, ((Number) v).longValue()));
            contagem.remove(gerenteRemovidoCpf);

            // Sem outro gerente: nada a redistribuir
            if (contagem.isEmpty()) {
                publicarEvento("remocao_gerente.concluida", gerenteRemovidoCpf);
                return;
            }

            // Gerente com menos contas recebe as contas
            String gerenteDestinoCpf = contagem.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT,
                    "Nenhum gerente disponível para redistribuição"));

            // Consulta MS Gerente (comando): nome do gerente destino
            String gerenteDestinoNome = buscarNomeGerente(gerenteDestinoCpf);

            // Etapa MS Conta (comando): reatribui todas as contas do gerente removido ao destino
            Map<String, Object> payload = new HashMap<>();
            payload.put("gerenteOrigemCpf", gerenteRemovidoCpf);
            payload.put("gerenteDestinoCpf", gerenteDestinoCpf);
            payload.put("gerenteDestinoNome", gerenteDestinoNome);
            payload.put("quantidade", -1);
            commandBus.enviarEAguardar("comando.conta.redistribuir", "redistribuir", payload);

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

    @SuppressWarnings("unchecked")
    private String buscarNomeGerente(String cpf) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("cpf", cpf);
            RespostaComando resp = commandBus.enviarEAguardar(
                "comando.gerente.consultar", "consultar_gerente", payload);
            Object nome = resp.getDados() != null ? resp.getDados().get("nome") : null;
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
