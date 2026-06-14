package com.dac.gerente.listener;

import com.dac.gerente.config.RabbitMQConfig;
import com.dac.gerente.dto.response.DadoGerente;
import com.dac.gerente.service.GerenteService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

// ComandoGerenteListener | recebe COMANDOS de consulta da saga via RabbitMQ e devolve a
// RESPOSTA correlacionada (comunicação assíncrona desacoplada com o orquestrador).
@Component
public class ComandoGerenteListener {

    @Autowired
    private GerenteService gerenteService;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @SuppressWarnings("unchecked")
    @RabbitListener(queues = RabbitMQConfig.FILA_COMANDO_GERENTE,
                    containerFactory = "rabbitListenerContainerFactory")
    public void onComando(Map<String, Object> msg) {
        String correlationId = (String) msg.get("correlationId");
        String tipo = (String) msg.get("tipo");
        Map<String, Object> payload = (Map<String, Object>) msg.getOrDefault("payload", new HashMap<>());

        Map<String, Object> resposta = new HashMap<>();
        resposta.put("correlationId", correlationId);
        Map<String, Object> dados = new HashMap<>();

        try {
            switch (tipo) {
                case "consultar_gerente": {
                    String cpf = (String) payload.get("cpf");
                    String nome = "";
                    try {
                        DadoGerente g = gerenteService.consultarPorCpf(cpf);
                        nome = g != null && g.getNome() != null ? g.getNome() : "";
                    } catch (Exception ignored) {
                        // gerente inexistente: devolve nome vazio
                    }
                    dados.put("nome", nome);
                    break;
                }
                default:
                    throw new IllegalArgumentException("Tipo de comando desconhecido: " + tipo);
            }
            resposta.put("sucesso", true);
            resposta.put("dados", dados);
        } catch (Exception e) {
            resposta.put("sucesso", false);
            resposta.put("erro", e.getMessage());
            System.err.println("gerente-service: comando '" + tipo + "' falhou: " + e.getMessage());
        }

        rabbitTemplate.convertAndSend(RabbitMQConfig.RESPOSTA_EXCHANGE, "resposta.gerente", resposta);
    }
}
