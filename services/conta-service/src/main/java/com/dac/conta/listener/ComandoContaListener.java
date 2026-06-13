package com.dac.conta.listener;

import com.dac.conta.config.RabbitMQConfig;
import com.dac.conta.dto.request.CriarContaRequestDTO;
import com.dac.conta.dto.response.ContaResponseDTO;
import com.dac.conta.service.ContaService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

// ComandoContaListener | recebe COMANDOS da saga via RabbitMQ, executa no ContaService e
// devolve a RESPOSTA correlacionada. Comunicação assíncrona desacoplada com o orquestrador.
@Component
public class ComandoContaListener {

    @Autowired
    private ContaService contaService;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @SuppressWarnings("unchecked")
    @RabbitListener(queues = RabbitMQConfig.FILA_COMANDO_CONTA,
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
                case "criar_conta": {
                    CriarContaRequestDTO req = new CriarContaRequestDTO();
                    req.setClienteCpf((String) payload.get("clienteCpf"));
                    req.setClienteNome((String) payload.get("clienteNome"));
                    req.setGerenteCpf((String) payload.get("gerenteCpf"));
                    req.setGerenteNome((String) payload.get("gerenteNome"));
                    Object lim = payload.get("limite");
                    req.setLimite(lim != null ? ((Number) lim).doubleValue() : 0.0);
                    ContaResponseDTO dto = contaService.criarConta(req);
                    dados.put("numero", dto.getNumero());
                    break;
                }
                case "remover_conta": {
                    contaService.removerContaPorCliente((String) payload.get("clienteCpf"));
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
            System.err.println("conta-service: comando '" + tipo + "' falhou: " + e.getMessage());
        }

        rabbitTemplate.convertAndSend(RabbitMQConfig.RESPOSTA_EXCHANGE, "resposta.conta", resposta);
    }
}
