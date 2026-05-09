package com.dac.conta.service;

import com.dac.conta.config.RabbitMQConfig;
import com.dac.conta.dto.evento.ContaAtualizadaEvento;
import com.dac.conta.dto.evento.MovimentacaoCriadaEvento;
import com.dac.conta.dto.request.AtualizarLimiteRequestDTO;
import com.dac.conta.dto.request.CriarContaRequestDTO;
import com.dac.conta.dto.request.DepositoRequestDTO;
import com.dac.conta.dto.request.RedistribuirRequestDTO;
import com.dac.conta.dto.request.SaqueRequestDTO;
import com.dac.conta.dto.request.TransferenciaRequestDTO;
import com.dac.conta.dto.response.ContaResponseDTO;
import com.dac.conta.dto.response.ExtratoResponseDTO;
import com.dac.conta.dto.response.ItemExtratoResponseDTO;
import com.dac.conta.dto.response.OperacaoResponseDTO;
import com.dac.conta.dto.response.SaldoResponseDTO;
import com.dac.conta.dto.response.TransferenciaResponseDTO;
import com.dac.conta.entity.ContaCUD;
import com.dac.conta.entity.ContaR;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
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

    // -------------------------
    // GET /contas/{numero}/saldo
    // -------------------------
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

    // -------------------------
    // POST /contas/{numero}/depositar
    // -------------------------
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

    // -------------------------
    // POST /contas/{numero}/sacar
    // -------------------------
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

    // -------------------------
    // POST /contas/{numero}/transferir
    // -------------------------
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

    // -------------------------
    // GET /contas/{numero}/extrato?inicio=...&fim=...
    // -------------------------
    public ExtratoResponseDTO consultarExtrato(String numero,
                                               LocalDateTime inicio,
                                               LocalDateTime fim) {
        return contaRRepository.findById(numero)
            .map(conta -> {
                List<MovimentacaoR> movs;
                if (inicio != null && fim != null) {
                    movs = movimentacaoRRepository
                        .findByContaOrigemOrContaDestinoAndDataHoraBetweenOrderByDataHoraDesc(
                            numero, numero, inicio, fim);
                } else {
                    movs = movimentacaoRRepository
                        .findByContaOrigemOrContaDestinoOrderByDataHoraDesc(numero, numero);
                }

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

    // -------------------------
    // GET /contas/por-cliente/{cpf}
    // -------------------------
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
    // GET /contas/contagem-por-gerente
    // Usado pelo gerente-service para R17/R18
    // -------------------------
    public Map<String, Long> contagemPorGerente() {
        List<Object[]> rows = contaCUDRepository.contarContasPorGerente();
        Map<String, Long> resultado = new HashMap<>();
        for (Object[] row : rows) {
            resultado.put((String) row[0], (Long) row[1]);
        }
        return resultado;
    }

    // -------------------------
    // GET /contas/saldo-positivo-por-gerente
    // Usado pelo gerente-service para R17 (desempate)
    // -------------------------
    public Map<String, Double> saldoPositivoPorGerente() {
        List<Object[]> rows = contaCUDRepository.somarSaldosPositivosPorGerente();
        Map<String, Double> resultado = new HashMap<>();
        for (Object[] row : rows) {
            resultado.put((String) row[0], ((Number) row[1]).doubleValue());
        }
        return resultado;
    }

    // -------------------------
    // POST /contas/redistribuir
    // Usado pelo gerente-service para R17/R18
    // quantidade=1: transfere 1 conta do origem para destino
    // quantidade=-1: transfere TODAS as contas do origem para destino
    // -------------------------
    @Transactional
    public void redistribuir(RedistribuirRequestDTO request) {
        List<ContaCUD> contas = contaCUDRepository
            .findByGerenteCpfOrdenado(request.getGerenteOrigemCpf());

        if (contas.isEmpty()) return;

        List<ContaCUD> paraTransferir = request.getQuantidade() == -1
            ? contas
            : contas.subList(0, Math.min(1, contas.size()));

        for (ContaCUD conta : paraTransferir) {
            conta.setGerenteCpf(request.getGerenteDestinoCpf());
            conta.setGerenteNome(request.getGerenteDestinoNome());
            contaCUDRepository.save(conta);
            publicarEventoConta(conta);
        }

        System.out.println("Redistribuídas " + paraTransferir.size() + " contas de "
            + request.getGerenteOrigemCpf() + " para " + request.getGerenteDestinoCpf());
    }

    // -------------------------
    // POST /contas/criar
    // Chamado pelo saga-service quando cliente é aprovado (R10)
    // -------------------------
    @Transactional
    public ContaResponseDTO criarConta(CriarContaRequestDTO request) {
        // Verifica se cliente já tem conta
        contaCUDRepository.findByClienteCpf(request.getClienteCpf()).ifPresent(c -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cliente já possui uma conta");
        });

        // Gera número de conta aleatório de 4 dígitos único
        String numero = gerarNumeroConta();

        ContaCUD conta = new ContaCUD();
        conta.setNumero(numero);
        conta.setClienteCpf(request.getClienteCpf());
        conta.setClienteNome(request.getClienteNome());
        conta.setGerenteCpf(request.getGerenteCpf());
        conta.setGerenteNome(request.getGerenteNome());
        conta.setSaldo(0.0);
        conta.setLimite(request.getLimite() != null ? request.getLimite() : 0.0);
        conta.setCriacao(LocalDateTime.now());
        contaCUDRepository.save(conta);

        // Sincroniza banco R via evento
        publicarEventoConta(conta);

        ContaResponseDTO dto = new ContaResponseDTO();
        dto.setNumero(numero);
        dto.setCliente(request.getClienteCpf());
        dto.setSaldo(0.0);
        dto.setLimite(conta.getLimite());
        dto.setGerente(request.getGerenteCpf());
        dto.setCriacao(LocalDateTime.now());
        return dto;
    }

    // -------------------------
    // PUT /contas/limite
    // Chamado quando cliente altera salário (R4)
    // -------------------------
    @Transactional
    public void atualizarLimite(AtualizarLimiteRequestDTO request) {
        ContaCUD conta = contaCUDRepository.findByClienteCpf(request.getClienteCpf())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Conta não encontrada para cliente: " + request.getClienteCpf()));

        double novoLimite = 0.0;
        if (request.getNovoSalario() != null && request.getNovoSalario() >= 2000) {
            novoLimite = request.getNovoSalario() / 2;
        }

        // Se novo limite for menor que o saldo negativo atual, ajusta para o saldo negativo
        if (conta.getSaldo() < 0 && novoLimite < Math.abs(conta.getSaldo())) {
            novoLimite = Math.abs(conta.getSaldo());
        }

        conta.setLimite(novoLimite);
        contaCUDRepository.save(conta);
        publicarEventoConta(conta);

        System.out.println("Limite atualizado para cliente " + request.getClienteCpf()
            + ": R$ " + novoLimite);
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

    private String gerarNumeroConta() {
        Random random = new Random();
        String numero;
        int tentativas = 0;
        do {
            numero = String.format("%04d", random.nextInt(10000));
            tentativas++;
            if (tentativas > 100) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Não foi possível gerar número de conta único");
            }
        } while (contaCUDRepository.existsById(numero));
        return numero;
    }
}