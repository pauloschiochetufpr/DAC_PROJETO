package com.dac.saga.bus;

import com.dac.saga.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

// SagaCommandBus | barramento de comando/resposta do orquestrador.
// Publica um COMANDO numa fila do serviço participante (assíncrono via RabbitMQ) e bloqueia
// a thread do gatilho até a RESPOSTA correlacionada chegar — assim a comunicação
// orquestrador<->serviço é 100% assíncrona via broker, mas o endpoint HTTP segue síncrono
// (necessário para os testes de integração).
@Service
public class SagaCommandBus {

    private static final long TIMEOUT_MS = 10000;

    private final RabbitTemplate rabbitTemplate;
    private final Map<String, CompletableFuture<RespostaComando>> pendentes = new ConcurrentHashMap<>();

    public SagaCommandBus(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public RespostaComando enviarEAguardar(String routingKey, String tipo, Map<String, Object> payload) {
        String correlationId = UUID.randomUUID().toString();
        CompletableFuture<RespostaComando> futuro = new CompletableFuture<>();
        pendentes.put(correlationId, futuro);
        try {
            Map<String, Object> comando = new HashMap<>();
            comando.put("correlationId", correlationId);
            comando.put("tipo", tipo);
            comando.put("payload", payload);
            rabbitTemplate.convertAndSend(RabbitMQConfig.COMANDO_EXCHANGE, routingKey, comando);

            RespostaComando resposta = futuro.get(TIMEOUT_MS, TimeUnit.MILLISECONDS);
            if (!resposta.isSucesso()) {
                throw new RuntimeException("Comando '" + tipo + "' falhou no serviço: " + resposta.getErro());
            }
            return resposta;
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Falha/timeout aguardando resposta do comando '" + tipo + "': " + e.getMessage(), e);
        } finally {
            pendentes.remove(correlationId);
        }
    }

    // completar | chamado pelo listener de respostas quando uma resposta correlacionada chega
    public void completar(RespostaComando resposta) {
        if (resposta.getCorrelationId() == null) return;
        CompletableFuture<RespostaComando> futuro = pendentes.get(resposta.getCorrelationId());
        if (futuro != null) {
            futuro.complete(resposta);
        }
    }
}
