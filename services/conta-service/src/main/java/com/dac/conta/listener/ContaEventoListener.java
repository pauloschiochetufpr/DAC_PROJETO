package com.dac.conta.listener;

import com.dac.conta.config.RabbitMQConfig;
import com.dac.conta.dto.evento.ContaAtualizadaEvento;
import com.dac.conta.dto.evento.MovimentacaoCriadaEvento;
import com.dac.conta.read.entity.ContaR;
import com.dac.conta.read.entity.MovimentacaoR;
import com.dac.conta.read.repository.ContaRRepository;
import com.dac.conta.read.repository.MovimentacaoRRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ContaEventoListener {

    @Autowired
    private ContaRRepository contaRRepository;

    @Autowired
    private MovimentacaoRRepository movimentacaoRRepository;

    @RabbitListener(queues = RabbitMQConfig.FILA_CONTA_ATUALIZADA,
                    containerFactory = "rabbitListenerContainerFactory")
    public void onContaAtualizada(ContaAtualizadaEvento evento) {
        try {
            ContaR contaR = contaRRepository.findById(evento.getNumero())
                .orElse(new ContaR());
            contaR.setNumero(evento.getNumero());
            contaR.setClienteCpf(evento.getClienteCpf());
            contaR.setClienteNome(evento.getClienteNome());
            contaR.setGerenteCpf(evento.getGerenteCpf());
            contaR.setGerenteNome(evento.getGerenteNome());
            contaR.setSaldo(evento.getSaldo());
            contaR.setLimite(evento.getLimite());
            if (evento.getStatus() != null) {
                contaR.setStatus(evento.getStatus());
            }
            contaRRepository.save(contaR);
            System.out.println("conta-service: banco R atualizado para conta " + evento.getNumero());
        } catch (Exception e) {
            System.err.println("conta-service: erro ao atualizar banco R - " + e.getMessage());
            throw e;
        }
    }

    @RabbitListener(queues = RabbitMQConfig.FILA_MOVIMENTACAO_CRIADA,
                    containerFactory = "rabbitListenerContainerFactory")
    public void onMovimentacaoCriada(MovimentacaoCriadaEvento evento) {
        try {
            MovimentacaoR movR = new MovimentacaoR();
            movR.setTipo(evento.getTipo());
            movR.setContaOrigem(evento.getContaOrigem());
            movR.setContaDestino(evento.getContaDestino());
            movR.setClienteOrigemCpf(evento.getClienteOrigemCpf());
            movR.setClienteDestinoCpf(evento.getClienteDestinoCpf());
            movR.setValor(evento.getValor());
            movR.setDataHora(evento.getDataHora());
            movimentacaoRRepository.save(movR);
            System.out.println("conta-service: movimentacao replicada no banco R");
        } catch (Exception e) {
            System.err.println("conta-service: erro ao replicar movimentacao - " + e.getMessage());
            throw e;
        }
    }
}