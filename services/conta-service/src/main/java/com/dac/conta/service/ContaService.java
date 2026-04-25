package com.dac.conta.service;

import com.dac.conta.config.RabbitMQConfig;
import com.dac.conta.dto.evento.ContaAtualizadaEvento;
import com.dac.conta.dto.evento.MovimentacaoCriadaEvento;
import com.dac.conta.dto.request.DepositoRequestDTO;
import com.dac.conta.dto.request.SaqueRequestDTO;
import com.dac.conta.dto.request.TransferenciaRequestDTO;
import com.dac.conta.dto.response.ContaResponseDTO;
import com.dac.conta.dto.response.ExtratoResponseDTO;
import com.dac.conta.dto.response.ItemExtratoResponseDTO;
import com.dac.conta.dto.response.OperacaoResponseDTO;
import com.dac.conta.dto.response.SaldoResponseDTO;
import com.dac.conta.dto.response.TransferenciaResponseDTO;
import com.dac.conta.entity.ContaCUD;
import com.dac.conta.entity.MovimentacaoCUD;
import com.dac.conta.entity.MovimentacaoR;
import com.dac.conta.entity.TipoMovimentacao;
import com.dac.conta.repository.ContaCUDRepository;
import com.dac.conta.repository.ContaRRepository;
import com.dac.conta.repository.MovimentacaoCUDRepository;
import com.dac.conta.repository.MovimentacaoRRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ContaService {

    @Autowired
    private ContaCUDRepository contaCUDRepository;

    @Autowired
    private ContaRRepository contaRRepository;

    @Autowired
    private MovimentacaoCUDRepository movimentacaoCUDRepository;

    @Autowired
    private MovimentacaoRRepository movimentacaoRRepository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    // GET /contas/{numero}/saldo
    public SaldoResponseDTO consultarSaldo(String numero) {
        return contaRRepository.findById(numero)
            .map(conta -> {
                SaldoResponseDTO dto = new SaldoResponseDTO();
                dto.setCliente(conta.getClienteCpf());
                dto.setConta(conta.getNumero());
                dto.setSaldo(conta.getSaldo().doubleValue());
                return dto;
            })
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta não encontrada"));
    }

    // POST /contas/{numero}/depositar
    @Transactional
    public OperacaoResponseDTO depositar(String numero, DepositoRequestDTO request) {
        ContaCUD conta = buscarContaCUD(numero);

        if (request.getValor() == null || request.getValor() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor deve ser positivo");
        }

        conta.setSaldo(conta.getSaldo() + request.getValor());
        contaCUDRepository.save(conta);

        MovimentacaoCUD mov = criarMovimentacao(
            TipoMovimentacao.DEPOSITO, null, numero, request.getValor());

        publicarEventoConta(conta);
        publicarEventoMovimentacao(mov, null, conta.getClienteCpf());

        return montarOperacaoResponse(numero, mov.getData(), conta.getSaldo());
    }

    // POST /contas/{numero}/sacar
    @Transactional
    public OperacaoResponseDTO sacar(String numero, SaqueRequestDTO request) {
        ContaCUD conta = buscarContaCUD(numero);

        if (request.getValor() == null || request.getValor() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor deve ser positivo");
        }
        if (conta.getSaldo() - request.getValor() < -conta.getLimite()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Saldo insuficiente");
        }

        conta.setSaldo(conta.getSaldo() - request.getValor());
        contaCUDRepository.save(conta);

        MovimentacaoCUD mov = criarMovimentacao(
            TipoMovimentacao.SAQUE, numero, null, request.getValor());

        publicarEventoConta(conta);
        publicarEventoMovimentacao(mov, conta.getClienteCpf(), null);

        return montarOperacaoResponse(numero, mov.getData(), conta.getSaldo());
    }

    // POST /contas/{numero}/transferir
    @Transactional
    public TransferenciaResponseDTO transferir(String numero, TransferenciaRequestDTO request) {
        if (numero.equals(request.getDestino())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Transferência para a mesma conta não permitida");
        }

        ContaCUD origem  = buscarContaCUD(numero);
        ContaCUD destino = buscarContaCUD(request.getDestino());

        if (request.getValor() == null || request.getValor() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Valor deve ser positivo");
        }
        if (origem.getSaldo() - request.getValor() < -origem.getLimite()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Saldo insuficiente");
        }

        origem.setSaldo(origem.getSaldo()   - request.getValor());
        destino.setSaldo(destino.getSaldo() + request.getValor());
        contaCUDRepository.save(origem);
        contaCUDRepository.save(destino);

        MovimentacaoCUD mov = criarMovimentacao(
            TipoMovimentacao.TRANSFERENCIA, numero, request.getDestino(), request.getValor());

        publicarEventoConta(origem);
        publicarEventoConta(destino);
        publicarEventoMovimentacao(mov, origem.getClienteCpf(), destino.getClienteCpf());

        TransferenciaResponseDTO dto = new TransferenciaResponseDTO();
        dto.setConta(numero);
        dto.setData(mov.getData());
        dto.setDestino(request.getDestino());
        dto.setSaldo(origem.getSaldo());
        dto.setValor(request.getValor());
        return dto;
    }

    // GET /contas/{numero}/extrato
    public ExtratoResponseDTO consultarExtrato(String numero) {
        return contaRRepository.findById(numero)
            .map(conta -> {
                List<MovimentacaoR> movs = movimentacaoRRepository
                    .findByContaOrigemOrContaDestinoOrderByDataHoraDesc(numero, numero);

                List<ItemExtratoResponseDTO> itens = movs.stream().map(m -> {
                    ItemExtratoResponseDTO item = new ItemExtratoResponseDTO();
                    item.setData(m.getDataHora());
                    item.setTipo(m.getTipo());
                    item.setOrigem(m.getContaOrigem());
                    item.setDestino(m.getContaDestino());
                    item.setValor(m.getValor().doubleValue());
                    return item;
                }).collect(Collectors.toList());

                ExtratoResponseDTO dto = new ExtratoResponseDTO();
                dto.setConta(numero);
                dto.setSaldo(conta.getSaldo().doubleValue());
                dto.setMovimentacoes(itens);
                return dto;
            })
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conta não encontrada"));
    }

    public ContaResponseDTO consultarContaPorCliente(String clienteCpf) {
        return contaRRepository.findByClienteCpf(clienteCpf)
        .map(conta -> {
            ContaResponseDTO dto = new ContaResponseDTO();
            dto.setCliente(conta.getClienteCpf());
            dto.setNumero(conta.getNumero());
            dto.setSaldo(conta.getSaldo() != null ? conta.getSaldo().doubleValue() : 0.0);
            dto.setLimite(conta.getLimite() != null ? conta.getLimite().doubleValue() : 0.0);
            dto.setGerente(conta.getGerenteCpf());
            dto.setCriacao(conta.getDataCriacao() != null
            ? conta.getDataCriacao().atStartOfDay() : null);
            return dto;
        })
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
            "Conta não encontrada para cliente: " + clienteCpf));
    }
    // -------------------------
    // Helpers privados
    // -------------------------

    private ContaCUD buscarContaCUD(String numero) {
        return contaCUDRepository.findById(numero)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Conta não encontrada: " + numero));
    }

    private MovimentacaoCUD criarMovimentacao(TipoMovimentacao tipo,
                                               String origem, String destino,
                                               Double valor) {
        MovimentacaoCUD mov = new MovimentacaoCUD();
        mov.setTipo(tipo);
        mov.setOrigem(origem);
        mov.setDestino(destino);
        mov.setValor(valor);
        mov.setData(LocalDateTime.now());
        return movimentacaoCUDRepository.save(mov);
    }

    private OperacaoResponseDTO montarOperacaoResponse(String numero,
                                                        LocalDateTime data,
                                                        Double saldo) {
        OperacaoResponseDTO dto = new OperacaoResponseDTO();
        dto.setConta(numero);
        dto.setData(data);
        dto.setSaldo(saldo);
        return dto;
    }

    private void publicarEventoConta(ContaCUD conta) {
        ContaAtualizadaEvento evento = new ContaAtualizadaEvento();
        evento.setNumero(conta.getNumero());
        evento.setClienteCpf(conta.getClienteCpf());
        evento.setClienteNome(conta.getClienteNome());
        evento.setGerenteCpf(conta.getGerenteCpf());
        evento.setGerenteNome(conta.getGerenteNome());
        evento.setSaldo(BigDecimal.valueOf(conta.getSaldo()));
        evento.setLimite(BigDecimal.valueOf(conta.getLimite()));
        rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_CONTA_ATUALIZADA, evento);
    }

    private void publicarEventoMovimentacao(MovimentacaoCUD mov,
                                             String clienteOrigemCpf,
                                             String clienteDestinoCpf) {
        MovimentacaoCriadaEvento evento = new MovimentacaoCriadaEvento();
        evento.setTipo(mov.getTipo().name());
        evento.setContaOrigem(mov.getOrigem());
        evento.setContaDestino(mov.getDestino());
        evento.setClienteOrigemCpf(clienteOrigemCpf);
        evento.setClienteDestinoCpf(clienteDestinoCpf);
        evento.setValor(BigDecimal.valueOf(mov.getValor()));
        evento.setDataHora(mov.getData());
        rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_MOVIMENTACAO_CRIADA, evento);
    }
}