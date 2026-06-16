package com.dac.conta.listener;

import com.dac.conta.config.RabbitMQConfig;
import com.dac.conta.dto.request.AtualizarLimiteRequestDTO;
import com.dac.conta.dto.request.CriarContaRequestDTO;
import com.dac.conta.dto.request.RedistribuirRequestDTO;
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

    // roda quando chega um comando na fila 'conta.comando.queue'
    @SuppressWarnings("unchecked")
    @RabbitListener(queues = RabbitMQConfig.FILA_COMANDO_CONTA,
                    containerFactory = "rabbitListenerContainerFactory")
    public void onComando(Map<String, Object> msg) {
        String correlationId = (String) msg.get("correlationId");   // mesmo id volta na resposta
        String tipo = (String) msg.get("tipo");                     // qual ação executar
        Map<String, Object> payload = (Map<String, Object>) msg.getOrDefault("payload", new HashMap<>());

        Map<String, Object> resposta = new HashMap<>();
        resposta.put("correlationId", correlationId);
        Map<String, Object> dados = new HashMap<>();

        try {
            // despacha o comando pro método certo do ContaService conforme o 'tipo'
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
                case "atualizar_limite": {
                    AtualizarLimiteRequestDTO req = new AtualizarLimiteRequestDTO();
                    req.setClienteCpf((String) payload.get("clienteCpf"));
                    Object sal = payload.get("novoSalario");
                    req.setNovoSalario(sal != null ? ((Number) sal).doubleValue() : null);
                    contaService.atualizarLimite(req);
                    break;
                }
                case "redistribuir": {
                    RedistribuirRequestDTO req = new RedistribuirRequestDTO();
                    req.setGerenteOrigemCpf((String) payload.get("gerenteOrigemCpf"));
                    req.setGerenteDestinoCpf((String) payload.get("gerenteDestinoCpf"));
                    req.setGerenteDestinoNome((String) payload.get("gerenteDestinoNome"));
                    Object qtd = payload.get("quantidade");
                    req.setQuantidade(qtd != null ? ((Number) qtd).intValue() : 1);
                    contaService.redistribuir(req);
                    break;
                }
                case "consultar_contagem": {
                    dados.put("contagem", contaService.contagemPorGerente());
                    break;
                }
                default:
                    throw new IllegalArgumentException("Tipo de comando desconhecido: " + tipo);
            }
            resposta.put("sucesso", true);
            resposta.put("dados", dados);
        } catch (Exception e) {
            // deu erro: devolve sucesso=false + mensagem; a saga vai compensar a partir disso
            resposta.put("sucesso", false);
            resposta.put("erro", e.getMessage());
            System.err.println("conta-service: comando '" + tipo + "' falhou: " + e.getMessage());
        }

        // devolve a RESPOSTA correlacionada pro orquestrador (exchange saga.resposta)
        rabbitTemplate.convertAndSend(RabbitMQConfig.RESPOSTA_EXCHANGE, "resposta.conta", resposta);
    }
}
