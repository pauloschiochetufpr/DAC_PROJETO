package com.dac.saga.bus;

import com.dac.saga.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.Map;

// RespostaSagaListener | consome as respostas dos serviços e libera o orquestrador que aguarda
@Component
public class RespostaSagaListener {

    private final SagaCommandBus bus;

    public RespostaSagaListener(SagaCommandBus bus) {
        this.bus = bus;
    }

    // roda quando um serviço devolve a resposta na fila 'saga.resposta.queue'
    @SuppressWarnings("unchecked")
    @RabbitListener(queues = RabbitMQConfig.FILA_RESPOSTA, containerFactory = "rabbitListenerContainerFactory")
    public void onResposta(Map<String, Object> msg) {
        // remonta o objeto de resposta a partir da mensagem JSON
        RespostaComando resposta = new RespostaComando();
        resposta.setCorrelationId((String) msg.get("correlationId"));
        resposta.setSucesso(Boolean.TRUE.equals(msg.get("sucesso")));
        resposta.setErro((String) msg.get("erro"));
        Object dados = msg.get("dados");
        if (dados instanceof Map) {
            resposta.setDados((Map<String, Object>) dados);
        }
        bus.completar(resposta);   // entrega ao bus, que destrava a saga que aguardava esse correlationId
    }
}
