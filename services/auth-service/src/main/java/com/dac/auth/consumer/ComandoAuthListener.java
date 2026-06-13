package com.dac.auth.consumer;

import com.dac.auth.config.RabbitMQConfig;
import com.dac.auth.service.UsuarioService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

// ComandoAuthListener | recebe COMANDOS da saga via RabbitMQ, executa no UsuarioService e
// devolve a RESPOSTA correlacionada. Comunicação assíncrona desacoplada com o orquestrador.
@Component
public class ComandoAuthListener {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @SuppressWarnings("unchecked")
    @RabbitListener(queues = RabbitMQConfig.FILA_COMANDO_AUTH,
                    containerFactory = "rabbitListenerContainerFactory")
    public void onComando(Map<String, Object> msg) {
        String correlationId = (String) msg.get("correlationId");
        String tipo = (String) msg.get("tipo");
        Map<String, Object> payload = (Map<String, Object>) msg.getOrDefault("payload", new HashMap<>());

        Map<String, Object> resposta = new HashMap<>();
        resposta.put("correlationId", correlationId);

        try {
            switch (tipo) {
                case "criar_usuario":
                    usuarioService.criarUsuario(
                        (String) payload.get("cpf"),
                        (String) payload.get("nome"),
                        (String) payload.get("email"),
                        (String) payload.get("senha"),
                        (String) payload.get("tipo")
                    );
                    break;
                case "remover_usuario":
                    usuarioService.removerUsuario((String) payload.get("cpf"));
                    break;
                default:
                    throw new IllegalArgumentException("Tipo de comando desconhecido: " + tipo);
            }
            resposta.put("sucesso", true);
            resposta.put("dados", new HashMap<>());
        } catch (Exception e) {
            resposta.put("sucesso", false);
            resposta.put("erro", e.getMessage());
            System.err.println("auth-service: comando '" + tipo + "' falhou: " + e.getMessage());
        }

        rabbitTemplate.convertAndSend(RabbitMQConfig.RESPOSTA_EXCHANGE, "resposta.auth", resposta);
    }
}
