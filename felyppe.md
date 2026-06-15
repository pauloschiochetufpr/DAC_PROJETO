# Código implementado por Felyppe — versão final do projeto

Gerado a partir do `git blame` da versão final entregue (branch `main`, HEAD do merge da `sagas`).
Lista o código atribuído ao autor **felyppe1201** presente na entrega final.

- **Seção 1**: arquivos majoritariamente meus (conteúdo completo).
- **Seção 2**: contribuições pontuais em arquivos compartilhados (com contagem de linhas).
- **Seção 3**: detalhe das minhas alterações nas sagas de autoria mista.

---

## 1. Arquivos majoritariamente meus (conteúdo completo)

### services/conta-service/src/main/java/com/dac/conta/service/ContaService.java
_(424/530 linhas minhas)_

```java
package com.dac.conta.service;

import com.dac.conta.config.RabbitMQConfig;
import com.dac.conta.dto.evento.ContaAtualizadaEvento;
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
import com.dac.conta.entity.MovimentacaoCUD;
import com.dac.conta.entity.TipoMovimentacao;
import com.dac.conta.read.entity.ContaR;
import com.dac.conta.read.entity.MovimentacaoR;
import com.dac.conta.repository.ContaCUDRepository;
import com.dac.conta.repository.MovimentacaoCUDRepository;
import com.dac.conta.read.repository.ContaRRepository;
import com.dac.conta.read.repository.MovimentacaoRRepository;
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

        conta.setSaldo(java.math.BigDecimal.valueOf(conta.getSaldo()).add(java.math.BigDecimal.valueOf(request.getValor())).doubleValue());
        contaCUDRepository.save(conta);

        MovimentacaoCUD mov = criarMovimentacao(
            TipoMovimentacao.DEPOSITO, numero, null, request.getValor());

        sincronizarContaR(conta);
        criarMovimentacaoR(mov, conta.getClienteCpf(), null);
        publicarEventoConta(conta);

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

        conta.setSaldo(java.math.BigDecimal.valueOf(conta.getSaldo()).subtract(java.math.BigDecimal.valueOf(request.getValor())).doubleValue());
        contaCUDRepository.save(conta);

        MovimentacaoCUD mov = criarMovimentacao(
            TipoMovimentacao.SAQUE, numero, null, request.getValor());

        sincronizarContaR(conta);
        criarMovimentacaoR(mov, conta.getClienteCpf(), null);
        publicarEventoConta(conta);

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

        origem.setSaldo(java.math.BigDecimal.valueOf(origem.getSaldo()).subtract(java.math.BigDecimal.valueOf(request.getValor())).doubleValue());
        destino.setSaldo(java.math.BigDecimal.valueOf(destino.getSaldo()).add(java.math.BigDecimal.valueOf(request.getValor())).doubleValue());
        contaCUDRepository.save(origem);
        contaCUDRepository.save(destino);

        MovimentacaoCUD mov = criarMovimentacao(
            TipoMovimentacao.TRANSFERENCIA, numero, request.getDestino(), request.getValor());

        sincronizarContaR(origem);
        sincronizarContaR(destino);
        criarMovimentacaoR(mov, origem.getClienteCpf(), destino.getClienteCpf());
        publicarEventoConta(origem);
        publicarEventoConta(destino);

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
                        .findByContaOrigemOrContaDestinoAndDataHoraBetweenOrderByDataHoraAsc(
                            numero, numero, inicio, fim);
                } else {
                    movs = movimentacaoRRepository
                        .findByContaOrigemOrContaDestinoOrderByDataHoraAsc(numero, numero);
                }

                List<ItemExtratoResponseDTO> itens = movs.stream().map(m -> {
                    ItemExtratoResponseDTO item = new ItemExtratoResponseDTO();
                    item.setData(m.getDataHora());
                    item.setTipo(mapearTipoMovimentacao(m.getTipo()));
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
    // GET /contas/por-gerente/{cpf}
    // -------------------------
    public List<ContaResponseDTO> consultarContasPorGerente(String gerenteCpf) {
        List<ContaR> contas = contaRRepository.findByGerenteCpf(gerenteCpf);
        return contas.stream().map(conta -> {
            ContaResponseDTO dto = new ContaResponseDTO();
            dto.setCliente(conta.getClienteCpf());
            dto.setNumero(conta.getNumero());
            dto.setSaldo(conta.getSaldo() != null ? conta.getSaldo().doubleValue() : 0.0);
            dto.setLimite(conta.getLimite() != null ? conta.getLimite().doubleValue() : 0.0);
            dto.setGerente(conta.getGerenteCpf());
            dto.setCriacao(conta.getDataCriacao() != null
                ? conta.getDataCriacao().atStartOfDay() : null);
            return dto;
        }).collect(Collectors.toList());
    }

    // -------------------------
    // GET /contas/contagem-por-gerente
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
    // GET /contas/saldo-negativo-por-gerente
    // -------------------------
    public Map<String, Double> saldoNegativoPorGerente() {
        List<Object[]> rows = contaCUDRepository.somarSaldosNegativosPorGerente();
        Map<String, Double> resultado = new HashMap<>();
        for (Object[] row : rows) {
            resultado.put((String) row[0], ((Number) row[1]).doubleValue());
        }
        return resultado;
    }

    // -------------------------
    // POST /contas/redistribuir
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
    // -------------------------
    @Transactional
    public ContaResponseDTO criarConta(CriarContaRequestDTO request) {
        validarCriacaoContaRequest(request);

        String clienteCpf = normalizarDocumento(request.getClienteCpf());
        String gerenteCpf = normalizarDocumento(request.getGerenteCpf());
        String clienteNome = normalizarTexto(request.getClienteNome());
        String gerenteNome = normalizarTexto(request.getGerenteNome());
        Double limite = request.getLimite() != null ? request.getLimite() : 0.0;

        contaCUDRepository.findByClienteCpf(clienteCpf).ifPresent(c -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cliente já possui uma conta");
        });

        String numero = gerarNumeroConta();

        ContaCUD conta = new ContaCUD();
        conta.setNumero(numero);
        conta.setClienteCpf(clienteCpf);
        conta.setClienteNome(clienteNome);
        conta.setGerenteCpf(gerenteCpf);
        conta.setGerenteNome(gerenteNome);
        conta.setSaldo(0.0);
        conta.setLimite(limite);
        conta.setCriacao(LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS));
        contaCUDRepository.save(conta);

        sincronizarContaR(conta);
        publicarEventoConta(conta);

        ContaResponseDTO dto = new ContaResponseDTO();
        dto.setNumero(numero);
        dto.setCliente(conta.getClienteCpf());
        dto.setSaldo(0.0);
        dto.setLimite(conta.getLimite());
        dto.setGerente(conta.getGerenteCpf());
        dto.setCriacao(conta.getCriacao());
        return dto;
    }

    // -------------------------
    // POST /contas/remover — ação compensatória da SAGA de autocadastro
    // Remove a conta dos dois bancos (CUD e R) caso uma etapa posterior da saga falhe.
    // -------------------------
    public void removerContaPorCliente(String clienteCpf) {
        String cpf = normalizarDocumento(clienteCpf);
        try {
            contaCUDRepository.findByClienteCpf(cpf).ifPresent(contaCUDRepository::delete);
        } catch (Exception e) {
            System.err.println("conta-service: aviso - remover conta CUD falhou: " + e.getMessage());
        }
        try {
            contaRRepository.findByClienteCpf(cpf).ifPresent(contaRRepository::delete);
        } catch (Exception e) {
            System.err.println("conta-service: aviso - remover conta R falhou: " + e.getMessage());
        }
        System.out.println("conta-service: conta removida (compensação saga) para cliente " + cpf);
    }

    // -------------------------
    // PUT /contas/limite
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

        if (conta.getSaldo() < 0 && novoLimite < Math.abs(conta.getSaldo())) {
            novoLimite = Math.abs(conta.getSaldo());
        }

        conta.setLimite(novoLimite);
        contaCUDRepository.save(conta);
        sincronizarContaR(conta);
        publicarEventoConta(conta);

        System.out.println("Limite atualizado para cliente " + request.getClienteCpf()
            + ": R$ " + novoLimite);
    }

    private void validarCriacaoContaRequest(CriarContaRequestDTO request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados da conta obrigatorios");
        }
        if (request.getClienteCpf() == null || request.getClienteCpf().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "clienteCpf obrigatorio");
        }
        if (request.getGerenteCpf() == null || request.getGerenteCpf().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "gerenteCpf obrigatorio");
        }

        String clienteCpf = normalizarDocumento(request.getClienteCpf());
        String gerenteCpf = normalizarDocumento(request.getGerenteCpf());

        if (clienteCpf.length() != 11) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "clienteCpf invalido");
        }
        if (gerenteCpf.length() != 11) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "gerenteCpf invalido");
        }
        if (request.getLimite() != null && request.getLimite() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "limite invalido");
        }
    }

    private String normalizarDocumento(String valor) {
        return valor == null ? null : valor.replaceAll("\\D", "");
    }

    private String normalizarTexto(String valor) {
        return valor == null ? null : valor.trim();
    }

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
        mov.setData(LocalDateTime.now().truncatedTo(java.time.temporal.ChronoUnit.MICROS));
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

    private void sincronizarContaR(ContaCUD conta) {
        try {
            ContaR contaR = contaRRepository.findById(conta.getNumero()).orElse(new ContaR());
            contaR.setNumero(conta.getNumero());
            contaR.setClienteCpf(conta.getClienteCpf());
            contaR.setClienteNome(conta.getClienteNome());
            contaR.setGerenteCpf(conta.getGerenteCpf());
            contaR.setGerenteNome(conta.getGerenteNome());
            contaR.setSaldo(BigDecimal.valueOf(conta.getSaldo()));
            contaR.setLimite(BigDecimal.valueOf(conta.getLimite()));
            if (contaR.getStatus() == null) contaR.setStatus("aprovado");
            if (contaR.getDataCriacao() == null) contaR.setDataCriacao(LocalDate.now());
            contaRRepository.save(contaR);
        } catch (Exception e) {
            System.err.println("conta-service: aviso - sincronizarContaR falhou: " + e.getMessage());
        }
    }

    private void criarMovimentacaoR(MovimentacaoCUD mov,
                                     String clienteOrigemCpf,
                                     String clienteDestinoCpf) {
        try {
            MovimentacaoR movR = new MovimentacaoR();
            movR.setTipo(mov.getTipo().name());
            movR.setContaOrigem(mov.getOrigem());
            movR.setContaDestino(mov.getDestino());
            movR.setClienteOrigemCpf(clienteOrigemCpf);
            movR.setClienteDestinoCpf(clienteDestinoCpf);
            movR.setValor(BigDecimal.valueOf(mov.getValor()));
            movR.setDataHora(mov.getData());
            movimentacaoRRepository.save(movR);
        } catch (Exception e) {
            System.err.println("conta-service: aviso - criarMovimentacaoR falhou: " + e.getMessage());
        }
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
        evento.setStatus("aprovado");
        rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_CONTA_ATUALIZADA, evento);
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

    // Mapeia tipo de movimentação do enum para texto em português com acentos
    private String mapearTipoMovimentacao(String tipo) {
        if (tipo == null) return null;
        return switch (tipo.toUpperCase()) {
            case "DEPOSITO" -> "depósito";
            case "SAQUE" -> "saque";
            case "TRANSFERENCIA" -> "transferência";
            default -> tipo.toLowerCase();
        };
    }
}
```

### services/cliente-service/src/main/java/com/dac/cliente/service/ClienteService.java
_(341/544 linhas minhas)_

```java
package com.dac.cliente.service;

import com.dac.cliente.config.RabbitMQConfig;
import com.dac.cliente.dto.request.AutocadastroRequestDTO;
import com.dac.cliente.dto.request.PerfilRequestDTO;
import com.dac.cliente.dto.response.ClienteParaAprovarResponseDTO;
import com.dac.cliente.dto.response.ClienteResponseDTO;
import com.dac.cliente.dto.response.DadosClienteResponseDTO;
import com.dac.cliente.entity.Cliente;
import com.dac.cliente.entity.StatusCliente;
import com.dac.cliente.repository.ClienteRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository repository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Value("${saga.services.conta:http://conta-service:8080}")
    private String contaUrl;

    @Value("${saga.services.saga:http://saga-service:8080}")
    private String sagaUrl;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // -------------------------
    // R1 — Autocadastro
    // Registra apenas solicitação pendente; usuário/senha são criados na aprovação.
    // -------------------------
    @Transactional
    public void autocadastro(AutocadastroRequestDTO dto) {
        validarAutocadastro(dto);

        String cpf = normalizarDocumento(dto.getCpf());

        if (repository.existsById(cpf)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cliente já cadastrado ou aguardando aprovação");
        }
        if (repository.existsByEmail(normalizarEmail(dto.getEmail()))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }

        Cliente c = new Cliente();
        c.setCpf(cpf);
        c.setNome(normalizarTexto(dto.getNome()));
        c.setEmail(normalizarEmail(dto.getEmail()));
        c.setTelefone(normalizarTexto(dto.getTelefone()));
        c.setSalario(dto.getSalario());
        c.setEndereco(normalizarTexto(dto.getEndereco()));
        c.setCep(normalizarDocumento(dto.getCep()));
        c.setCidade(normalizarTexto(dto.getCidade()));
        c.setEstado(normalizarUf(dto.getEstado()));
        c.setStatus(StatusCliente.PENDENTE);

        repository.save(c);

    }

    // -------------------------
    // R9 — Listar pendentes
    // -------------------------
    public List<ClienteParaAprovarResponseDTO> listarParaAprovar() {
        return repository.findByStatus(StatusCliente.PENDENTE)
                .stream()
                .map(this::toParaAprovarDTO)
                .collect(Collectors.toList());
    }

    // -------------------------
    // R12 — Listar aprovados (para gerente — retorna clientes do próprio gerente)
    // -------------------------
    public List<DadosClienteResponseDTO> listarTodosAprovados() {
        return repository.findByStatusOrderByNomeAsc(StatusCliente.APROVADO)
                .stream()
                .map(this::toDadosClienteDTO)
                .collect(Collectors.toList());
    }

    // -------------------------
    // R12 — Listar clientes do gerente (filtra por gerente CPF via conta-service)
    // -------------------------
    public List<DadosClienteResponseDTO> listarClientesDoGerente(String gerenteCpf) {
        try {
            String json = httpGet(contaUrl + "/contas/por-gerente/" + gerenteCpf);
            List<Map<String, Object>> contas = objectMapper.readValue(json,
                new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, Object>>>() {});

            return contas.stream()
                .map(conta -> {
                    String clienteCpf = stringVal(conta.get("cliente"));
                    DadosClienteResponseDTO dto = repository.findById(clienteCpf)
                        .map(this::toDadosClienteDTOSimples)
                        .orElse(null);
                    if (dto != null) {
                        dto.setConta(stringVal(conta.get("numero")));
                        dto.setSaldo(doubleVal(conta.get("saldo")));
                        dto.setLimite(doubleVal(conta.get("limite")));
                        dto.setGerente(stringVal(conta.get("gerente")));
                    }
                    return dto;
                })
                .filter(java.util.Objects::nonNull)
                .sorted(Comparator.comparing(DadosClienteResponseDTO::getNome, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
        } catch (Exception e) {
            // Fallback: retorna lista vazia se conta-service indisponível
            return List.of();
        }
    }

    // Mapper simples sem buscar conta (será preenchido pelo chamador)
    private DadosClienteResponseDTO toDadosClienteDTOSimples(Cliente c) {
        DadosClienteResponseDTO dto = new DadosClienteResponseDTO();
        dto.setCpf(c.getCpf());
        dto.setNome(c.getNome());
        dto.setEmail(c.getEmail());
        dto.setTelefone(c.getTelefone());
        dto.setEndereco(c.getEndereco());
        dto.setCep(c.getCep());
        dto.setCidade(c.getCidade());
        dto.setEstado(c.getEstado());
        dto.setSalario(c.getSalario());
        return dto;
    }

    // -------------------------
    // R16 — Relatório admin
    // -------------------------
    public List<DadosClienteResponseDTO> listarParaRelatorio() {
        return repository.findByStatusOrderByNomeAsc(StatusCliente.APROVADO)
                .stream()
                .map(this::toDadosClienteDTO)
                .collect(Collectors.toList());
    }

    // -------------------------
    // Melhores clientes — top 3 por saldo_positivo (apenas contas com histórico)
    // -------------------------
    public List<ClienteResponseDTO> listarMelhoresClientes() {
        java.time.LocalDate hoje = java.time.LocalDate.now();
        return repository.findByStatusOrderByNomeAsc(StatusCliente.APROVADO)
                .stream()
                .map(c -> {
                    Map<String, Object> conta = buscarContaPorCliente(c.getCpf());
                    if (conta == null) return null;
                    // Excluir contas criadas hoje (recém-aprovadas, sem histórico)
                    Object criacaoObj = conta.get("criacao");
                    if (criacaoObj != null) {
                        try {
                            java.time.LocalDate criacao = java.time.LocalDate.parse(
                                criacaoObj.toString().substring(0, 10));
                            if (!criacao.isBefore(hoje)) return null;
                        } catch (Exception ignored) {}
                    }
                    ClienteResponseDTO dto = new ClienteResponseDTO();
                    dto.setCpf(c.getCpf());
                    dto.setNome(c.getNome());
                    dto.setEmail(c.getEmail());
                    dto.setTelefone(c.getTelefone());
                    dto.setEndereco(c.getEndereco());
                    dto.setCidade(c.getCidade());
                    dto.setEstado(c.getEstado());
                    dto.setConta(stringVal(conta.get("numero")));
                    dto.setSaldo(calcSaldoPositivo(doubleVal(conta.get("saldo")), doubleVal(conta.get("limite"))));
                    dto.setLimite(doubleVal(conta.get("limite")));
                    return dto;
                })
                .filter(java.util.Objects::nonNull)
                .sorted((a, b) -> Double.compare(
                    b.getSaldo() != null ? b.getSaldo() : 0,
                    a.getSaldo() != null ? a.getSaldo() : 0))
                .limit(3)
                .collect(Collectors.toList());
    }

    private double calcSaldoPositivo(Double saldo, Double limite) {
        if (saldo == null) return 0;
        if (saldo > 0) return saldo;
        if (saldo == 0 && limite != null) return limite;
        return 0;
    }

    // -------------------------
    // R13 — Consultar por CPF
    // -------------------------
    public DadosClienteResponseDTO consultarPorCpf(String cpf) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Cliente não encontrado"));

        // Clientes rejeitados devem retornar 404
        if (c.getStatus() == StatusCliente.REJEITADO) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                "Cliente não encontrado");
        }

        return toDadosClienteDTO(c);
    }

    // -------------------------
    // R4 — Atualizar perfil
    // Se salário mudar, publica para conta-service atualizar limite
    // -------------------------
    @Transactional
    public DadosClienteResponseDTO atualizarPerfil(String cpf, PerfilRequestDTO dto) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Cliente não encontrado"));

        if (dto.getEmail() != null && !dto.getEmail().equals(c.getEmail())) {
            if (repository.existsByEmail(normalizarEmail(dto.getEmail()))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Email já cadastrado por outro cliente");
            }
        }

        boolean salarioAlterado = dto.getSalario() != null
            && !dto.getSalario().equals(c.getSalario());

        if (dto.getNome() != null)     c.setNome(normalizarTexto(dto.getNome()));
        if (dto.getEmail() != null)    c.setEmail(normalizarEmail(dto.getEmail()));
        if (dto.getSalario() != null)  c.setSalario(dto.getSalario());
        if (dto.getEndereco() != null) c.setEndereco(normalizarTexto(dto.getEndereco()));
        if (dto.getCep() != null)      c.setCep(normalizarDocumento(dto.getCep()));
        if (dto.getCidade() != null)   c.setCidade(normalizarTexto(dto.getCidade()));
        if (dto.getEstado() != null)   c.setEstado(normalizarUf(dto.getEstado()));

        repository.save(c);

        try {
            Map<String, String> authUpdate = new HashMap<>();
            authUpdate.put("cpf", cpf);
            if (dto.getNome() != null)  authUpdate.put("nome", normalizarTexto(dto.getNome()));
            if (dto.getEmail() != null) authUpdate.put("email", normalizarEmail(dto.getEmail()));
            rabbitTemplate.convertAndSend(RabbitMQConfig.AUTH_EXCHANGE, "auth.atualizar", authUpdate);
        } catch (Exception e) {
            System.err.println("cliente-service: aviso - não foi possível publicar evento auth.atualizar: "
                + e.getMessage());
        }

        // R4: se salário mudou, dispara a SAGA de alteração de perfil (orquestrada pelo
        // saga-service), que coordena o recálculo do limite no conta-service.
        if (salarioAlterado) {
            // Se a saga (recálculo de limite na conta) falhar, propaga para que o @Transactional
            // reverta a alteração dos dados do cliente já aplicada acima (compensação local).
            try {
                Map<String, Object> body = new HashMap<>();
                body.put("cpf", cpf);
                body.put("novoSalario", dto.getSalario());
                httpPost(sagaUrl + "/saga/alterar-perfil", objectMapper.writeValueAsString(body));
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Falha na saga de alteração de perfil: " + e.getMessage());
            }
        }

        return toDadosClienteDTO(c);
    }

    // -------------------------
    // R10 — Aprovar cliente
    // Publica para saga-service criar conta
    // -------------------------
    @Transactional
    public DadosClienteResponseDTO aprovarCliente(String cpf) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Cliente não encontrado"));

        if (c.getStatus() != StatusCliente.PENDENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cliente não está pendente de aprovação");
        }

        c.setStatus(StatusCliente.APROVADO);
        c.setDataAprovacao(LocalDateTime.now());
        repository.save(c);

        // Calcula limite baseado no salário
        double limite = 0.0;
        if (c.getSalario() != null && c.getSalario() >= 2000) {
            limite = c.getSalario() / 2;
        }

        // Chama saga-service sincronamente para criar conta + selecionar gerente + criar auth
        try {
            Map<String, Object> sagaEvento = new HashMap<>();
            sagaEvento.put("cpf", cpf);
            sagaEvento.put("nome", c.getNome());
            sagaEvento.put("email", c.getEmail());
            sagaEvento.put("limite", limite);
            httpPost(sagaUrl + "/saga/aprovar", objectMapper.writeValueAsString(sagaEvento));
        } catch (Exception e) {
            System.err.println("cliente-service: erro na aprovação síncrona via saga: "
                + e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Falha ao criar conta para o cliente: " + e.getMessage());
        }

        return toDadosClienteDTO(c);
    }

    // -------------------------
    // R11 — Rejeitar cliente
    // Remove do banco e publica para auth-service remover usuário
    // -------------------------
    @Transactional
    public void rejeitarCliente(String cpf, String motivo) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Cliente não encontrado"));

        if (c.getStatus() != StatusCliente.PENDENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Cliente não está pendente de aprovação");
        }

        // Deleta o cliente em vez de apenas marcar como REJEITADO,
        // pois o teste espera 404 ao consultar depois
        repository.delete(c);

        // Remove usuário do auth-service
        try {
            Map<String, String> authEvento = new HashMap<>();
            authEvento.put("acao", "remover");
            authEvento.put("cpf", cpf);
            rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_AUTH_REMOVER, authEvento);
        } catch (Exception e) {
            System.err.println("cliente-service: aviso - não foi possível publicar evento auth.remover: "
                + e.getMessage());
        }
    }


    // -------------------------
    // HTTP client helpers para buscar dados do conta-service
    // -------------------------

    private Map<String, Object> buscarContaPorCliente(String cpf) {
        try {
            String json = httpGet(contaUrl + "/contas/por-cliente/" + cpf);
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            // Cliente pode não ter conta ainda (pendente, autocadastro recém-feito)
            return null;
        }
    }

    private String httpGet(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .GET()
            .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
        }
        return response.body();
    }

    private String httpPut(String url, String jsonBody) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .PUT(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
        }
        return response.body();
    }

    private String httpPost(String url, String jsonBody) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
        }
        return response.body();
    }

    // -------------------------
    // Normalização
    // -------------------------

    private String normalizarTexto(String v) {
        return v == null ? null : v.trim();
    }

    private String normalizarEmail(String v) {
        return v == null ? null : v.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizarDocumento(String v) {
        return v == null ? null : v.replaceAll("\\D", "");
    }

    private String normalizarUf(String v) {
        return v == null ? null : v.trim().toUpperCase(Locale.ROOT);
    }

    private boolean estaVazio(String v) {
        return v == null || v.trim().isEmpty();
    }

    // -------------------------
    // Validação de autocadastro
    // -------------------------

    private void validarAutocadastro(AutocadastroRequestDTO dto) {
        if (dto == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dados obrigatórios");
        if (estaVazio(dto.getCpf()))      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF obrigatório");
        if (estaVazio(dto.getNome()))     throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome obrigatório");
        if (estaVazio(dto.getEmail()))    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email obrigatório");
        if (estaVazio(dto.getEndereco())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Endereço obrigatório");
        if (estaVazio(dto.getCep()))      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CEP obrigatório");
        if (estaVazio(dto.getCidade()))   throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cidade obrigatória");
        if (estaVazio(dto.getEstado()))   throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estado obrigatório");
        if (dto.getSalario() == null || dto.getSalario() < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Salário inválido");

        String cpf = normalizarDocumento(dto.getCpf());
        if (!com.dac.cliente.util.CpfValidator.isValid(cpf))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF inválido");

        String cep = normalizarDocumento(dto.getCep());
        if (cep.length() != 8)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CEP inválido");

        String email = normalizarEmail(dto.getEmail());
        if (!email.contains("@") || email.startsWith("@") || email.endsWith("@"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email inválido");

        String estado = normalizarUf(dto.getEstado());
        if (estado.length() != 2)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "UF inválida");
    }

    // -------------------------
    // Mappers
    // -------------------------

    private ClienteParaAprovarResponseDTO toParaAprovarDTO(Cliente c) {
        ClienteParaAprovarResponseDTO dto = new ClienteParaAprovarResponseDTO();
        dto.setCpf(c.getCpf());
        dto.setNome(c.getNome());
        dto.setEmail(c.getEmail());
        dto.setSalario(c.getSalario());
        dto.setEndereco(c.getEndereco());
        dto.setCidade(c.getCidade());
        dto.setEstado(c.getEstado());
        return dto;
    }

    private ClienteResponseDTO toClienteResponseDTO(Cliente c) {
        ClienteResponseDTO dto = new ClienteResponseDTO();
        dto.setCpf(c.getCpf());
        dto.setNome(c.getNome());
        dto.setEmail(c.getEmail());
        dto.setTelefone(c.getTelefone());
        dto.setEndereco(c.getEndereco());
        dto.setCidade(c.getCidade());
        dto.setEstado(c.getEstado());

        // Enriquecer com dados da conta
        Map<String, Object> conta = buscarContaPorCliente(c.getCpf());
        if (conta != null) {
            dto.setConta(stringVal(conta.get("numero")));
            dto.setSaldo(doubleVal(conta.get("saldo")));
            dto.setLimite(doubleVal(conta.get("limite")));
        }
        return dto;
    }

    private DadosClienteResponseDTO toDadosClienteDTO(Cliente c) {
        DadosClienteResponseDTO dto = new DadosClienteResponseDTO();
        dto.setCpf(c.getCpf());
        dto.setNome(c.getNome());
        dto.setTelefone(c.getTelefone());
        dto.setEmail(c.getEmail());
        dto.setEndereco(c.getEndereco());
        dto.setCep(c.getCep());
        dto.setCidade(c.getCidade());
        dto.setEstado(c.getEstado());
        dto.setSalario(c.getSalario());

        // Enriquecer com dados da conta (saldo, limite, conta, gerente)
        Map<String, Object> conta = buscarContaPorCliente(c.getCpf());
        if (conta != null) {
            dto.setConta(stringVal(conta.get("numero")));
            dto.setSaldo(doubleVal(conta.get("saldo")));
            dto.setLimite(doubleVal(conta.get("limite")));
            dto.setGerente(stringVal(conta.get("gerente")));
        }
        return dto;
    }

    // Helpers para conversão de tipos
    private String stringVal(Object v) {
        return v == null ? null : v.toString();
    }

    private Double doubleVal(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(v.toString());
        } catch (Exception e) {
            return null;
        }
    }
}
```

### services/conta-service/src/main/java/com/dac/conta/service/DevService.java
_(175/175 linhas minhas)_

```java
package com.dac.conta.service;

import com.dac.conta.entity.ContaCUD;
import com.dac.conta.entity.MovimentacaoCUD;
import com.dac.conta.entity.TipoMovimentacao;
import com.dac.conta.read.entity.ContaR;
import com.dac.conta.read.entity.MovimentacaoR;
import com.dac.conta.repository.ContaCUDRepository;
import com.dac.conta.repository.MovimentacaoCUDRepository;
import com.dac.conta.read.repository.ContaRRepository;
import com.dac.conta.read.repository.MovimentacaoRRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DevService {

    @Autowired
    private ContaCUDRepository contaCUDRepository;

    @Autowired
    private ContaRRepository contaRRepository;

    @Autowired
    private MovimentacaoCUDRepository movimentacaoCUDRepository;

    @Autowired
    private MovimentacaoRRepository movimentacaoRRepository;

    @Transactional
    public void resetComMocks() {
        movimentacaoCUDRepository.deleteAll();
        contaCUDRepository.deleteAll();
        contaCUDRepository.saveAll(mockContasCUD());
        movimentacaoCUDRepository.saveAll(mockMovimentacoesCUD());

        movimentacaoRRepository.deleteAll();
        contaRRepository.deleteAll();
        contaRRepository.saveAll(mockContasR());
        movimentacaoRRepository.saveAll(mockMovimentacoesR());
    }

    // -------------------------
    // Mocks CUD
    // -------------------------

    private List<ContaCUD> mockContasCUD() {
        return List.of(
            contaCUD("1291", "12912861012", "Catharyna",  "98574307084", "Geniéve",     800.0,    5000.0, LocalDateTime.of(2000,  1,  1, 0, 0)),
            contaCUD("0950", "09506382000", "Cleuddônio", "64065268052", "Godophredo", -10000.0, 10000.0, LocalDateTime.of(1990, 10, 10, 0, 0)),
            contaCUD("8573", "85733854057", "Catianna",   "23862179060", "Gyândula",   -1000.0,   1500.0, LocalDateTime.of(2012, 12, 12, 0, 0)),
            contaCUD("5887", "58872160006", "Cutardo",    "98574307084", "Geniéve",   150000.0,      0.0, LocalDateTime.of(2022,  2, 22, 0, 0)),
            contaCUD("7617", "76179646090", "Coândrya",   "64065268052", "Godophredo",     0.0,   1500.0, LocalDateTime.of(2025,  1,  1, 0, 0))
        );
    }

    private List<MovimentacaoCUD> mockMovimentacoesCUD() {
        return List.of(
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "1291",   1000.0, LocalDateTime.of(2020,  1,  1, 10, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "1291",    900.0, LocalDateTime.of(2020,  1,  1, 11, 0)),
            movCUD(TipoMovimentacao.SAQUE,        "1291",   null,     550.0, LocalDateTime.of(2020,  1,  1, 12, 0)),
            movCUD(TipoMovimentacao.SAQUE,        "1291",   null,     350.0, LocalDateTime.of(2020,  1,  1, 13, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "1291",   2000.0, LocalDateTime.of(2020,  1, 10, 15, 0)),
            movCUD(TipoMovimentacao.SAQUE,        "1291",   null,     500.0, LocalDateTime.of(2020,  1, 15,  8, 0)),
            movCUD(TipoMovimentacao.TRANSFERENCIA,"1291",  "0950",   1700.0, LocalDateTime.of(2020,  1, 20, 12, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "0950",   1000.0, LocalDateTime.of(2025,  1,  1, 12, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "0950",   5000.0, LocalDateTime.of(2025,  1,  2, 10, 0)),
            movCUD(TipoMovimentacao.SAQUE,        "0950",   null,     200.0, LocalDateTime.of(2025,  1, 10, 10, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "0950",   7000.0, LocalDateTime.of(2025,  2,  5, 10, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "8573",   1000.0, LocalDateTime.of(2025,  5,  5, 10, 0)),
            movCUD(TipoMovimentacao.SAQUE,        "8573",   null,    2000.0, LocalDateTime.of(2025,  5,  6, 10, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "5887", 150000.0, LocalDateTime.of(2025,  6,  1, 10, 0))
        );
    }

    // -------------------------
    // Mocks R
    // -------------------------

    private List<ContaR> mockContasR() {
        return List.of(
            contaR("1291", "12912861012", "Catharyna",  "98574307084", "Geniéve",    new BigDecimal("800"),     new BigDecimal("5000"),  "aprovado", LocalDate.of(2000,  1,  1)),
            contaR("0950", "09506382000", "Cleuddônio", "64065268052", "Godophredo", new BigDecimal("-10000"),  new BigDecimal("10000"), "aprovado", LocalDate.of(1990, 10, 10)),
            contaR("8573", "85733854057", "Catianna",   "23862179060", "Gyândula",   new BigDecimal("-1000"),   new BigDecimal("1500"),  "aprovado", LocalDate.of(2012, 12, 12)),
            contaR("5887", "58872160006", "Cutardo",    "98574307084", "Geniéve",    new BigDecimal("150000"),  new BigDecimal("0"),     "aprovado", LocalDate.of(2022,  2, 22)),
            contaR("7617", "76179646090", "Coândrya",   "64065268052", "Godophredo", new BigDecimal("0"),       new BigDecimal("1500"),  "aprovado", LocalDate.of(2025,  1,  1))
        );
    }

    private List<MovimentacaoR> mockMovimentacoesR() {
        return List.of(
            movR("DEPOSITO",      null,   "1291", null,          "12912861012", new BigDecimal("1000"),   LocalDateTime.of(2020,  1,  1, 10, 0)),
            movR("DEPOSITO",      null,   "1291", null,          "12912861012", new BigDecimal("900"),    LocalDateTime.of(2020,  1,  1, 11, 0)),
            movR("SAQUE",        "1291",   null,  "12912861012", null,          new BigDecimal("550"),    LocalDateTime.of(2020,  1,  1, 12, 0)),
            movR("SAQUE",        "1291",   null,  "12912861012", null,          new BigDecimal("350"),    LocalDateTime.of(2020,  1,  1, 13, 0)),
            movR("DEPOSITO",      null,   "1291", null,          "12912861012", new BigDecimal("2000"),   LocalDateTime.of(2020,  1, 10, 15, 0)),
            movR("SAQUE",        "1291",   null,  "12912861012", null,          new BigDecimal("500"),    LocalDateTime.of(2020,  1, 15,  8, 0)),
            movR("TRANSFERENCIA","1291",  "0950", "12912861012", "09506382000", new BigDecimal("1700"),   LocalDateTime.of(2020,  1, 20, 12, 0)),
            movR("DEPOSITO",      null,   "0950", null,          "09506382000", new BigDecimal("1000"),   LocalDateTime.of(2025,  1,  1, 12, 0)),
            movR("DEPOSITO",      null,   "0950", null,          "09506382000", new BigDecimal("5000"),   LocalDateTime.of(2025,  1,  2, 10, 0)),
            movR("SAQUE",        "0950",   null,  "09506382000", null,          new BigDecimal("200"),    LocalDateTime.of(2025,  1, 10, 10, 0)),
            movR("DEPOSITO",      null,   "0950", null,          "09506382000", new BigDecimal("7000"),   LocalDateTime.of(2025,  2,  5, 10, 0)),
            movR("DEPOSITO",      null,   "8573", null,          "85733854057", new BigDecimal("1000"),   LocalDateTime.of(2025,  5,  5, 10, 0)),
            movR("SAQUE",        "8573",   null,  "85733854057", null,          new BigDecimal("2000"),   LocalDateTime.of(2025,  5,  6, 10, 0)),
            movR("DEPOSITO",      null,   "5887", null,          "58872160006", new BigDecimal("150000"), LocalDateTime.of(2025,  6,  1, 10, 0))
        );
    }

    // -------------------------
    // Helpers
    // -------------------------

    private ContaCUD contaCUD(String numero, String clienteCpf, String clienteNome,
                               String gerenteCpf, String gerenteNome,
                               Double saldo, Double limite, LocalDateTime criacao) {
        ContaCUD c = new ContaCUD();
        c.setNumero(numero);
        c.setClienteCpf(clienteCpf);
        c.setClienteNome(clienteNome);
        c.setGerenteCpf(gerenteCpf);
        c.setGerenteNome(gerenteNome);
        c.setSaldo(saldo);
        c.setLimite(limite);
        c.setCriacao(criacao);
        return c;
    }

    private MovimentacaoCUD movCUD(TipoMovimentacao tipo, String origem, String destino,
                                    Double valor, LocalDateTime data) {
        MovimentacaoCUD m = new MovimentacaoCUD();
        m.setTipo(tipo);
        m.setOrigem(origem);
        m.setDestino(destino);
        m.setValor(valor);
        m.setData(data);
        return m;
    }

    private ContaR contaR(String numero, String clienteCpf, String clienteNome,
                           String gerenteCpf, String gerenteNome,
                           BigDecimal saldo, BigDecimal limite,
                           String status, LocalDate dataCriacao) {
        ContaR c = new ContaR();
        c.setNumero(numero);
        c.setClienteCpf(clienteCpf);
        c.setClienteNome(clienteNome);
        c.setGerenteCpf(gerenteCpf);
        c.setGerenteNome(gerenteNome);
        c.setSaldo(saldo);
        c.setLimite(limite);
        c.setStatus(status);
        c.setDataCriacao(dataCriacao);
        return c;
    }

    private MovimentacaoR movR(String tipo, String contaOrigem, String contaDestino,
                                String clienteOrigemCpf, String clienteDestinoCpf,
                                BigDecimal valor, LocalDateTime dataHora) {
        MovimentacaoR m = new MovimentacaoR();
        m.setTipo(tipo);
        m.setContaOrigem(contaOrigem);
        m.setContaDestino(contaDestino);
        m.setClienteOrigemCpf(clienteOrigemCpf);
        m.setClienteDestinoCpf(clienteDestinoCpf);
        m.setValor(valor);
        m.setDataHora(dataHora);
        return m;
    }
}```

### services/saga-service/src/main/java/com/dac/saga/service/InsercaoGerenteSagaService.java
_(139/139 linhas minhas)_

```java
package com.dac.saga.service;

import com.dac.saga.bus.RespostaComando;
import com.dac.saga.bus.SagaCommandBus;
import com.dac.saga.config.RabbitMQConfig;
import com.dac.saga.util.SagaCompensacao;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

// InsercaoGerenteSagaService | orquestra a SAGA de Inserção de Gerente (R17).
// Comunicação com os serviços 100% assíncrona via RabbitMQ (comando/resposta).
// Etapas:
//   1. MS Gerente: inserção do gerente (gerente-service dispara a saga; rollback transacional local)
//   2. MS Auth: criação do usuário (compensação: remover usuário)
//   3. MS Conta: consultar gerente com mais contas e atribuir 1 conta ao novo gerente
@Service
public class InsercaoGerenteSagaService {

    private final RabbitTemplate rabbitTemplate;
    private final SagaCommandBus commandBus;

    public InsercaoGerenteSagaService(RabbitTemplate rabbitTemplate, SagaCommandBus commandBus) {
        this.rabbitTemplate = rabbitTemplate;
        this.commandBus = commandBus;
    }

    public void executar(String cpf, String nome, String email, String senha, String tipo) {
        if (cpf == null || cpf.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF do novo gerente obrigatório");
        }

        String tipoNorm = tipo == null ? "gerente" : tipo.trim().toLowerCase();
        publicarEvento("insercao_gerente.iniciada", cpf);

        SagaCompensacao compensacao = new SagaCompensacao();
        try {
            // Etapa MS Auth (comando): cria o usuário. Compensação: removê-lo.
            criarUsuarioNoAuth(cpf, nome, email, senha, tipoNorm);
            compensacao.registrar("remover usuário auth do gerente " + cpf, () -> removerUsuarioNoAuth(cpf));

            // Etapa MS Conta: somente gerentes recebem conta; administrador não.
            if ("gerente".equals(tipoNorm)) {
                redistribuirContaParaNovoGerente(cpf, nome);
            }

            publicarEvento("insercao_gerente.concluida", cpf);
        } catch (ResponseStatusException e) {
            compensacao.compensar();
            publicarEvento("insercao_gerente.falha", cpf);
            throw e;
        } catch (Exception e) {
            compensacao.compensar();
            publicarEvento("insercao_gerente.falha", cpf);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Falha na saga de inserção de gerente: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private void redistribuirContaParaNovoGerente(String novoGerenteCpf, String novoGerenteNome) {
        // Consulta MS Conta (comando): contagem de contas por gerente
        RespostaComando resp = commandBus.enviarEAguardar(
            "comando.conta.consultar-contagem", "consultar_contagem", new HashMap<>());
        Map<String, Object> contagemRaw = resp.getDados() != null
            ? (Map<String, Object>) resp.getDados().getOrDefault("contagem", new HashMap<>())
            : new HashMap<>();

        Map<String, Long> contagem = new HashMap<>();
        contagemRaw.forEach((k, v) -> contagem.put(k, ((Number) v).longValue()));

        if (contagem.isEmpty()) {
            return;
        }

        long maxContas = contagem.values().stream().mapToLong(Long::longValue).max().orElse(0);

        // Primeiro/único gerente com no máximo uma conta: novo gerente fica sem contas
        if (maxContas <= 1 && contagem.size() == 1) {
            return;
        }

        // Gerente com mais contas; em caso de empate, ordem natural do CPF
        List<String> candidatos = contagem.entrySet().stream()
            .filter(e -> e.getValue() == maxContas)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());

        String gerenteOrigem = candidatos.size() == 1
            ? candidatos.get(0)
            : candidatos.stream().min(Comparator.naturalOrder()).orElse(candidatos.get(0));

        // Etapa MS Conta (comando): atribui 1 conta do gerente de origem ao novo gerente
        Map<String, Object> payload = new HashMap<>();
        payload.put("gerenteOrigemCpf", gerenteOrigem);
        payload.put("gerenteDestinoCpf", novoGerenteCpf);
        payload.put("gerenteDestinoNome", novoGerenteNome);
        payload.put("quantidade", 1);
        commandBus.enviarEAguardar("comando.conta.redistribuir", "redistribuir", payload);

        System.out.println("Saga inserção de gerente: 1 conta redistribuída de "
            + gerenteOrigem + " para " + novoGerenteCpf);
    }

    private void criarUsuarioNoAuth(String cpf, String nome, String email, String senha, String tipo) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("cpf", cpf);
        payload.put("nome", nome);
        payload.put("email", email != null ? email.toLowerCase(Locale.ROOT) : null);
        payload.put("senha", senha);
        payload.put("tipo", tipo);
        commandBus.enviarEAguardar("comando.auth.criar", "criar_usuario", payload);
    }

    private void removerUsuarioNoAuth(String cpf) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("cpf", cpf);
        commandBus.enviarEAguardar("comando.auth.remover", "remover_usuario", payload);
    }

    private void publicarEvento(String routingKey, String gerenteCpf) {
        try {
            Map<String, Object> evento = new HashMap<>();
            evento.put("saga", "insercao_gerente");
            evento.put("gerenteCpf", gerenteCpf);
            rabbitTemplate.convertAndSend(RabbitMQConfig.SAGA_EXCHANGE, routingKey, evento);
        } catch (Exception ignored) {
            // publicação de evento de acompanhamento é best-effort
        }
    }
}
```

### services/conta-service/src/main/java/com/dac/conta/controller/ContaController.java
_(123/141 linhas minhas)_

```java
package com.dac.conta.controller;

import com.dac.conta.dto.request.AtualizarLimiteRequestDTO;
import com.dac.conta.dto.request.CriarContaRequestDTO;
import com.dac.conta.dto.request.DepositoRequestDTO;
import com.dac.conta.dto.request.RedistribuirRequestDTO;
import com.dac.conta.dto.request.SaqueRequestDTO;
import com.dac.conta.dto.request.TransferenciaRequestDTO;
import com.dac.conta.dto.response.ContaResponseDTO;
import com.dac.conta.dto.response.ExtratoResponseDTO;
import com.dac.conta.dto.response.OperacaoResponseDTO;
import com.dac.conta.dto.response.SaldoResponseDTO;
import com.dac.conta.dto.response.TransferenciaResponseDTO;
import com.dac.conta.service.ContaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/contas")
public class ContaController {

    @Autowired
    private ContaService contaService;

    // -------------------------
    // Operações de conta do cliente
    // -------------------------

    @GetMapping("/{numero}/saldo")
    public ResponseEntity<SaldoResponseDTO> saldo(@PathVariable String numero) {
        return ResponseEntity.ok(contaService.consultarSaldo(numero));
    }

    @PostMapping("/{numero}/depositar")
    public ResponseEntity<OperacaoResponseDTO> depositar(
            @PathVariable String numero,
            @RequestBody DepositoRequestDTO request) {
        return ResponseEntity.ok(contaService.depositar(numero, request));
    }

    @PostMapping("/{numero}/sacar")
    public ResponseEntity<OperacaoResponseDTO> sacar(
            @PathVariable String numero,
            @RequestBody SaqueRequestDTO request) {
        return ResponseEntity.ok(contaService.sacar(numero, request));
    }

    @PostMapping("/{numero}/transferir")
    public ResponseEntity<TransferenciaResponseDTO> transferir(
            @PathVariable String numero,
            @RequestBody TransferenciaRequestDTO request) {
        return ResponseEntity.ok(contaService.transferir(numero, request));
    }

    // GET /{numero}/extrato?dataInicio=2025-01-01&dataFim=2025-12-31
    @GetMapping("/{numero}/extrato")
    public ResponseEntity<ExtratoResponseDTO> extrato(
            @PathVariable String numero,
            @RequestParam(required = false) String dataInicio,
            @RequestParam(required = false) String dataFim) {
        LocalDateTime inicio = dataInicio != null
            ? LocalDate.parse(dataInicio).atStartOfDay() : null;
        LocalDateTime fim = dataFim != null
            ? LocalDate.parse(dataFim).atTime(23, 59, 59) : null;
        return ResponseEntity.ok(contaService.consultarExtrato(numero, inicio, fim));
    }

    // -------------------------
    // Consultas de conta
    // -------------------------

    @GetMapping("/por-cliente/{cpf}")
    public ResponseEntity<ContaResponseDTO> contaPorCliente(@PathVariable String cpf) {
        return ResponseEntity.ok(contaService.consultarContaPorCliente(cpf));
    }

    @GetMapping("/por-gerente/{cpf}")
    public ResponseEntity<List<ContaResponseDTO>> contasPorGerente(@PathVariable String cpf) {
        return ResponseEntity.ok(contaService.consultarContasPorGerente(cpf));
    }

    // -------------------------
    // Endpoints internos para o gerente-service (R17/R18)
    // -------------------------

    @GetMapping("/contagem-por-gerente")
    public ResponseEntity<Map<String, Long>> contagemPorGerente() {
        return ResponseEntity.ok(contaService.contagemPorGerente());
    }

    @GetMapping("/saldo-positivo-por-gerente")
    public ResponseEntity<Map<String, Double>> saldoPositivoPorGerente() {
        return ResponseEntity.ok(contaService.saldoPositivoPorGerente());
    }

    @GetMapping("/saldo-negativo-por-gerente")
    public ResponseEntity<Map<String, Double>> saldoNegativoPorGerente() {
        return ResponseEntity.ok(contaService.saldoNegativoPorGerente());
    }

    @PostMapping("/redistribuir")
    public ResponseEntity<Void> redistribuir(@RequestBody RedistribuirRequestDTO request) {
        contaService.redistribuir(request);
        return ResponseEntity.ok().build();
    }

    // -------------------------
    // Endpoint interno para o saga-service (R10)
    // -------------------------

    @PostMapping("/criar")
    public ResponseEntity<ContaResponseDTO> criarConta(@RequestBody CriarContaRequestDTO request) {
        return ResponseEntity.status(201).body(contaService.criarConta(request));
    }

    // -------------------------
    // Endpoint interno para atualização de limite (R4)
    // -------------------------

    @PutMapping("/limite")
    public ResponseEntity<Void> atualizarLimite(@RequestBody AtualizarLimiteRequestDTO request) {
        contaService.atualizarLimite(request);
        return ResponseEntity.ok().build();
    }

    // -------------------------
    // Endpoint interno de compensação (rollback da SAGA de autocadastro)
    // -------------------------

    @PostMapping("/remover")
    public ResponseEntity<Void> remover(@RequestBody Map<String, String> body) {
        contaService.removerContaPorCliente(body.get("clienteCpf"));
        return ResponseEntity.ok().build();
    }
}```

### services/saga-service/src/main/java/com/dac/saga/service/RemocaoGerenteSagaService.java
_(112/112 linhas minhas)_

```java
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
```

### services/conta-service/src/main/java/com/dac/conta/listener/ComandoContaListener.java
_(93/93 linhas minhas)_

```java
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
            resposta.put("sucesso", false);
            resposta.put("erro", e.getMessage());
            System.err.println("conta-service: comando '" + tipo + "' falhou: " + e.getMessage());
        }

        rabbitTemplate.convertAndSend(RabbitMQConfig.RESPOSTA_EXCHANGE, "resposta.conta", resposta);
    }
}
```

### services/conta-service/src/main/java/com/dac/conta/config/RabbitMQConfig.java
_(88/88 linhas minhas)_

```java
package com.dac.conta.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String FILA_RESET               = "saga.reset";
    public static final String FILA_CONTA_ATUALIZADA    = "conta.atualizada";
    public static final String FILA_MOVIMENTACAO_CRIADA = "conta.movimentacao.criada";
    public static final String FILA_LIMITE              = "conta.limite";

    // Comando/resposta da saga (orquestrador -> conta -> orquestrador)
    public static final String COMANDO_EXCHANGE   = "saga.comando";
    public static final String RESPOSTA_EXCHANGE  = "saga.resposta";
    public static final String FILA_COMANDO_CONTA = "conta.comando.queue";

    @Bean
    public Queue filaReset() {
        return new Queue(FILA_RESET, true);
    }

    @Bean
    public TopicExchange comandoExchange() {
        return new TopicExchange(COMANDO_EXCHANGE);
    }

    @Bean
    public TopicExchange respostaExchange() {
        return new TopicExchange(RESPOSTA_EXCHANGE);
    }

    @Bean
    public Queue filaComandoConta() {
        return new Queue(FILA_COMANDO_CONTA, true);
    }

    @Bean
    public Binding bindingComandoConta(Queue filaComandoConta, TopicExchange comandoExchange) {
        return BindingBuilder.bind(filaComandoConta).to(comandoExchange).with("comando.conta.#");
    }

    @Bean
    public Queue filaContaAtualizada() {
        return new Queue(FILA_CONTA_ATUALIZADA, true);
    }

    @Bean
    public Queue filaMovimentacaoCriada() {
        return new Queue(FILA_MOVIMENTACAO_CRIADA, true);
    }

    @Bean
    public Queue filaLimite() {
        return new Queue(FILA_LIMITE, true);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter());
        return factory;
    }
}```

### services/conta-service/src/main/java/com/dac/conta/entity/MovimentacaoCUD.java
_(84/84 linhas minhas)_

```java
package com.dac.conta.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "movimentacao")
public class MovimentacaoCUD {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private TipoMovimentacao tipo;

    @Column(name = "conta_origem")
    private String origem;

    @Column(name = "conta_destino")
    private String destino;

    private Double valor;

    @Column(name = "data_hora")
    private LocalDateTime data;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public TipoMovimentacao getTipo() {
        return tipo;
    }

    public void setTipo(TipoMovimentacao tipo) {
        this.tipo = tipo;
    }

    public String getOrigem() {
        return origem;
    }

    public void setOrigem(String origem) {
        this.origem = origem;
    }

    public String getDestino() {
        return destino;
    }

    public void setDestino(String destino) {
        this.destino = destino;
    }

    public Double getValor() {
        return valor;
    }

    public void setValor(Double valor) {
        this.valor = valor;
    }

    public LocalDateTime getData() {
        return data;
    }

    public void setData(LocalDateTime data) {
        this.data = data;
    }
    
}```

### services/auth-service/src/main/java/com/dac/auth/service/UsuarioService.java
_(73/73 linhas minhas)_

```java
package com.dac.auth.service;

// entidades
import com.dac.auth.entity.Usuario;
// repositórios
import com.dac.auth.repository.UsuarioRepository;
// util
import com.dac.auth.util.DevLog;
// Spring
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

// UsuarioService | lógica compartilhada de criação/hash de usuário,
// usada tanto pelo consumer RabbitMQ (assíncrono) quanto pelo endpoint interno (síncrono)
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // hashIfNeeded | aplica BCrypt, evitando hash duplo quando a senha já vier em formato bcrypt
    public String hashIfNeeded(String senha) {
        if (senha == null || senha.isBlank()) return senha;
        if (senha.matches("^\\$2[aby]\\$.{56}$")) {
            return senha;
        }
        return passwordEncoder.encode(senha);
    }

    // criarUsuario | cria o usuário de forma idempotente; retorna true se criou, false se já existia
    public boolean criarUsuario(String cpf, String nome, String email, String senha, String tipo) {
        if (cpf == null || cpf.isBlank()) return false;

        Optional<Usuario> existente = usuarioRepository.findByCpf(cpf);
        if (existente.isPresent()) {
            DevLog.log("criarUsuario ignorado - CPF ja existe: " + cpf);
            return false;
        }

        Usuario usuario = new Usuario();
        usuario.setCpf(cpf);
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setSenhaHash(hashIfNeeded(senha));
        usuario.setTipo(tipo);

        usuarioRepository.save(usuario);
        DevLog.log("criarUsuario OK - email: " + email + ", CPF: " + cpf);
        return true;
    }

    // removerUsuario | remove o usuário pelo CPF; ação compensatória usada pelas sagas.
    // Retorna true se removeu, false se não existia.
    public boolean removerUsuario(String cpf) {
        if (cpf == null || cpf.isBlank()) return false;

        Optional<Usuario> existente = usuarioRepository.findByCpf(cpf);
        if (existente.isEmpty()) {
            return false;
        }

        usuarioRepository.delete(existente.get());
        DevLog.log("removerUsuario OK (compensação) - CPF: " + cpf);
        return true;
    }
}
```

### services/gerente-service/src/main/java/com/dac/gerente/config/RabbitMQConfig.java
_(70/70 linhas minhas)_

```java
package com.dac.gerente.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String FILA_RESET = "saga.reset";

    // Comando/resposta da saga (orquestrador -> gerente -> orquestrador)
    public static final String COMANDO_EXCHANGE     = "saga.comando";
    public static final String RESPOSTA_EXCHANGE    = "saga.resposta";
    public static final String FILA_COMANDO_GERENTE = "gerente.comando.queue";

    @Bean
    public Queue filaReset() {
        return new Queue(FILA_RESET, true);
    }

    @Bean
    public TopicExchange comandoExchange() {
        return new TopicExchange(COMANDO_EXCHANGE);
    }

    @Bean
    public TopicExchange respostaExchange() {
        return new TopicExchange(RESPOSTA_EXCHANGE);
    }

    @Bean
    public Queue filaComandoGerente() {
        return new Queue(FILA_COMANDO_GERENTE, true);
    }

    @Bean
    public Binding bindingComandoGerente(Queue filaComandoGerente, TopicExchange comandoExchange) {
        return BindingBuilder.bind(filaComandoGerente).to(comandoExchange).with("comando.gerente.#");
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter());
        return factory;
    }
}```

### services/cliente-service/src/main/java/com/dac/cliente/controller/ClienteController.java
_(69/89 linhas minhas)_

```java
package com.dac.cliente.controller;

import com.dac.cliente.dto.request.AutocadastroRequestDTO;
import com.dac.cliente.dto.request.PerfilRequestDTO;
import com.dac.cliente.dto.request.RejeitarClienteRequestDTO;
import com.dac.cliente.dto.response.ClienteParaAprovarResponseDTO;
import com.dac.cliente.dto.response.ClienteResponseDTO;
import com.dac.cliente.dto.response.DadosClienteResponseDTO;
import com.dac.cliente.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    @Autowired
    private ClienteService service;

    @PostMapping
    public ResponseEntity<?> autocadastro(@RequestBody AutocadastroRequestDTO dto) {
        service.autocadastro(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(java.util.Map.of("cpf", dto.getCpf(), "email", dto.getEmail()));
    }

    @GetMapping
    public ResponseEntity<?> listar(
            @RequestParam(value = "filtro", required = false) String filtro,
            @RequestHeader(value = "x-user-role", required = false) String userRole,
            @RequestHeader(value = "x-user-cpf", required = false) String userCpf) {

        if ("para_aprovar".equalsIgnoreCase(filtro)) {
            List<ClienteParaAprovarResponseDTO> pendentes = service.listarParaAprovar();
            return ResponseEntity.ok(pendentes);
        }

        if ("adm_relatorio_clientes".equalsIgnoreCase(filtro)) {
            if (userRole == null || !"administrador".equalsIgnoreCase(userRole)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Acesso negado");
            }
            List<DadosClienteResponseDTO> relatorio = service.listarParaRelatorio();
            return ResponseEntity.ok(relatorio);
        }

        if ("melhores_clientes".equalsIgnoreCase(filtro)) {
            List<ClienteResponseDTO> melhores = service.listarMelhoresClientes();
            return ResponseEntity.ok(melhores);
        }

        if ("gerente".equalsIgnoreCase(userRole) && userCpf != null) {
            List<DadosClienteResponseDTO> meusClientes = service.listarClientesDoGerente(userCpf);
            return ResponseEntity.ok(meusClientes);
        }

        List<DadosClienteResponseDTO> todos = service.listarTodosAprovados();
        return ResponseEntity.ok(todos);
    }

    @GetMapping("/{cpf}")
    public ResponseEntity<DadosClienteResponseDTO> consultar(@PathVariable String cpf) {
        return ResponseEntity.ok(service.consultarPorCpf(cpf));
    }

    @PutMapping("/{cpf}")
    public ResponseEntity<DadosClienteResponseDTO> atualizarPerfil(
            @PathVariable String cpf,
            @RequestBody PerfilRequestDTO dto) {
        return ResponseEntity.ok(service.atualizarPerfil(cpf, dto));
    }

    @PostMapping("/{cpf}/aprovar")
    public ResponseEntity<DadosClienteResponseDTO> aprovar(@PathVariable String cpf) {
        DadosClienteResponseDTO dto = service.aprovarCliente(cpf);
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/{cpf}/rejeitar")
    public ResponseEntity<?> rejeitar(
            @PathVariable String cpf,
            @RequestBody RejeitarClienteRequestDTO dto) {
        service.rejeitarCliente(cpf, dto.getMotivo());
        return ResponseEntity.ok("Cliente rejeitado com sucesso.");
    }
}```

### services/saga-service/src/main/java/com/dac/saga/config/RabbitMQConfig.java
_(67/108 linhas minhas)_

```java
package com.dac.saga.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String FILA_RESET = "saga.reset";
    public static final String SAGA_EXCHANGE = "saga.exchange";
    public static final String FILA_APROVAR = "saga.aprovar_cliente.queue";
    public static final String FILA_REJEITAR = "saga.rejeitar_cliente.queue";
    public static final String FILA_EMAIL_SEND_ACTIVATION = "email.send.activation";

    // Topologia de comando/resposta (orquestrador <-> serviços, assíncrono via broker)
    public static final String COMANDO_EXCHANGE = "saga.comando";
    public static final String RESPOSTA_EXCHANGE = "saga.resposta";
    public static final String FILA_RESPOSTA = "saga.resposta.queue";

    @Bean
    public Queue filaReset() {
        return new Queue(FILA_RESET, true);
    }

    @Bean
    public TopicExchange sagaExchange() {
        return new TopicExchange(SAGA_EXCHANGE);
    }

    @Bean
    public TopicExchange authExchange() {
        return new TopicExchange("auth.exchange");
    }

    @Bean
    public Queue filaAprovar() {
        return new Queue(FILA_APROVAR, true);
    }

    @Bean
    public Queue filaRejeitar() {
        return new Queue(FILA_REJEITAR, true);
    }

    @Bean
    public Queue filaEmailSendActivation() {
        return new Queue(FILA_EMAIL_SEND_ACTIVATION, true);
    }

    @Bean
    public Binding bindingAprovar(Queue filaAprovar, TopicExchange sagaExchange) {
        return BindingBuilder.bind(filaAprovar).to(sagaExchange).with("saga.aprovar_cliente");
    }

    @Bean
    public Binding bindingRejeitar(Queue filaRejeitar, TopicExchange sagaExchange) {
        return BindingBuilder.bind(filaRejeitar).to(sagaExchange).with("saga.rejeitar_cliente");
    }

    // Exchange por onde o orquestrador publica COMANDOS para os serviços participantes
    @Bean
    public TopicExchange comandoExchange() {
        return new TopicExchange(COMANDO_EXCHANGE);
    }

    // Exchange + fila por onde os serviços devolvem as RESPOSTAS ao orquestrador
    @Bean
    public TopicExchange respostaExchange() {
        return new TopicExchange(RESPOSTA_EXCHANGE);
    }

    @Bean
    public Queue filaResposta() {
        return new Queue(FILA_RESPOSTA, true);
    }

    @Bean
    public Binding bindingResposta(Queue filaResposta, TopicExchange respostaExchange) {
        return BindingBuilder.bind(filaResposta).to(respostaExchange).with("resposta.#");
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter());
        return factory;
    }
}
```

### services/saga-service/src/main/java/com/dac/saga/service/AlteracaoPerfilSagaService.java
_(66/66 linhas minhas)_

```java
package com.dac.saga.service;

import com.dac.saga.bus.SagaCommandBus;
import com.dac.saga.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;

// AlteracaoPerfilSagaService | orquestra a SAGA de Alteração de Perfil (R4).
// Etapas coordenadas pelo orquestrador:
//   1. MS Cliente: alteração dos dados do cliente (executada pelo próprio cliente-service,
//      que dispara esta saga)
//   2. MS Conta: cálculo e alteração do novo limite da conta
@Service
public class AlteracaoPerfilSagaService {

    private final RabbitTemplate rabbitTemplate;
    private final SagaCommandBus commandBus;

    public AlteracaoPerfilSagaService(RabbitTemplate rabbitTemplate, SagaCommandBus commandBus) {
        this.rabbitTemplate = rabbitTemplate;
        this.commandBus = commandBus;
    }

    public void executar(String cpf, Double novoSalario) {
        if (cpf == null || cpf.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF obrigatório para alteração de perfil");
        }
        if (novoSalario == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Novo salário obrigatório para recálculo de limite");
        }

        publicarEvento("perfil.iniciada", cpf, novoSalario);

        // Etapa MS Conta via comando assíncrono (RabbitMQ): recalcular e atualizar o limite.
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("clienteCpf", cpf);
            payload.put("novoSalario", novoSalario);
            commandBus.enviarEAguardar("comando.conta.limite", "atualizar_limite", payload);
        } catch (Exception e) {
            publicarEvento("perfil.falha", cpf, novoSalario);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Falha ao atualizar limite da conta na saga de alteração de perfil: " + e.getMessage(), e);
        }

        publicarEvento("perfil.concluida", cpf, novoSalario);
        System.out.println("Saga alteração de perfil: limite recalculado para cliente " + cpf);
    }

    private void publicarEvento(String routingKey, String cpf, Double novoSalario) {
        try {
            Map<String, Object> evento = new HashMap<>();
            evento.put("saga", "alteracao_perfil");
            evento.put("cpf", cpf);
            evento.put("novoSalario", novoSalario);
            rabbitTemplate.convertAndSend(RabbitMQConfig.SAGA_EXCHANGE, routingKey, evento);
        } catch (Exception ignored) {
            // publicação de evento de acompanhamento é best-effort
        }
    }
}
```

### services/conta-service/src/main/java/com/dac/conta/listener/ContaEventoListener.java
_(66/66 linhas minhas)_

```java
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
}```

### services/auth-service/src/main/java/com/dac/auth/config/RabbitMQConfig.java
_(66/106 linhas minhas)_

```java
package com.dac.auth.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String FILA_RESET = "saga.reset";
    public static final String AUTH_EXCHANGE = "auth.exchange";
    public static final String FILA_AUTH_CRIAR = "auth.criar.queue";
    public static final String FILA_AUTH_ATUALIZAR = "auth.atualizar.queue";
    public static final String FILA_AUTH_REMOVER = "auth.remover.queue";

    // Comando/resposta da saga (orquestrador -> auth -> orquestrador)
    public static final String COMANDO_EXCHANGE  = "saga.comando";
    public static final String RESPOSTA_EXCHANGE = "saga.resposta";
    public static final String FILA_COMANDO_AUTH = "auth.comando.queue";

    @Bean
    public Queue filaReset() {
        return new Queue(FILA_RESET, true);
    }

    @Bean
    public TopicExchange comandoExchange() {
        return new TopicExchange(COMANDO_EXCHANGE);
    }

    @Bean
    public TopicExchange respostaExchange() {
        return new TopicExchange(RESPOSTA_EXCHANGE);
    }

    @Bean
    public Queue filaComandoAuth() {
        return new Queue(FILA_COMANDO_AUTH, true);
    }

    @Bean
    public Binding bindingComandoAuth(Queue filaComandoAuth, TopicExchange comandoExchange) {
        return BindingBuilder.bind(filaComandoAuth).to(comandoExchange).with("comando.auth.#");
    }

    @Bean
    public TopicExchange authExchange() {
        return new TopicExchange(AUTH_EXCHANGE);
    }

    @Bean
    public Queue filaAuthCriar() {
        return new Queue(FILA_AUTH_CRIAR, true);
    }

    @Bean
    public Queue filaAuthAtualizar() {
        return new Queue(FILA_AUTH_ATUALIZAR, true);
    }

    @Bean
    public Queue filaAuthRemover() {
        return new Queue(FILA_AUTH_REMOVER, true);
    }

    @Bean
    public Binding bindingCriar(Queue filaAuthCriar, TopicExchange authExchange) {
        return BindingBuilder.bind(filaAuthCriar).to(authExchange).with("auth.criar");
    }

    @Bean
    public Binding bindingAtualizar(Queue filaAuthAtualizar, TopicExchange authExchange) {
        return BindingBuilder.bind(filaAuthAtualizar).to(authExchange).with("auth.atualizar");
    }

    @Bean
    public Binding bindingRemover(Queue filaAuthRemover, TopicExchange authExchange) {
        return BindingBuilder.bind(filaAuthRemover).to(authExchange).with("auth.remover");
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter());
        return factory;
    }
}```

### services/cliente-service/src/main/java/com/dac/cliente/config/RabbitMQConfig.java
_(65/79 linhas minhas)_

```java
package com.dac.cliente.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String FILA_RESET         = "saga.reset";
    public static final String SAGA_EXCHANGE      = "saga.exchange";
    public static final String AUTH_EXCHANGE      = "auth.exchange";
    public static final String FILA_SAGA_APROVAR  = "saga.aprovar_cliente";
    public static final String FILA_CONTA_LIMITE  = "conta.limite";
    public static final String FILA_AUTH_CRIAR    = "auth.criar";
    public static final String FILA_AUTH_REMOVER  = "auth.remover";

    @Bean
    public Queue filaReset() {
        return new Queue(FILA_RESET, true);
    }

    @Bean
    public TopicExchange sagaExchange() {
        return new TopicExchange(SAGA_EXCHANGE);
    }

    @Bean
    public TopicExchange authExchange() {
        return new TopicExchange(AUTH_EXCHANGE);
    }

    @Bean
    public Queue filaSagaAprovar() {
        return new Queue(FILA_SAGA_APROVAR, true);
    }

    @Bean
    public Queue filaContaLimite() {
        return new Queue(FILA_CONTA_LIMITE, true);
    }

    @Bean
    public Queue filaAuthCriar() {
        return new Queue(FILA_AUTH_CRIAR, true);
    }

    @Bean
    public Queue filaAuthRemover() {
        return new Queue(FILA_AUTH_REMOVER, true);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(messageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(messageConverter());
        return factory;
    }
}
```

### services/saga-service/src/main/java/com/dac/saga/bus/SagaCommandBus.java
_(64/64 linhas minhas)_

```java
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
```

### services/gerente-service/src/main/java/com/dac/gerente/listener/ComandoGerenteListener.java
_(64/64 linhas minhas)_

```java
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
```

### services/conta-service/src/main/java/com/dac/conta/config/DataSourceConfig.java
_(64/64 linhas minhas)_

```java
package com.dac.conta.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.Properties;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
    basePackages = "com.dac.conta.repository",
    entityManagerFactoryRef = "entityManagerFactory",
    transactionManagerRef = "transactionManager"
)
public class DataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties(prefix = "spring.datasource")
    public DataSource mainDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    @Primary
    public LocalContainerEntityManagerFactoryBean entityManagerFactory(
            @Qualifier("mainDataSource") DataSource mainDataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(mainDataSource);
        em.setPackagesToScan("com.dac.conta.entity");
        em.setPersistenceUnitName("cud");

        HibernateJpaVendorAdapter adapter = new HibernateJpaVendorAdapter();
        adapter.setGenerateDdl(true);
        em.setJpaVendorAdapter(adapter);

        Properties props = new Properties();
        props.setProperty("hibernate.hbm2ddl.auto", "update");
        props.setProperty("hibernate.format_sql", "true");
        props.setProperty("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        em.setJpaProperties(props);

        return em;
    }

    @Bean
    @Primary
    public PlatformTransactionManager transactionManager(
            @Qualifier("entityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
}```

### services/auth-service/src/main/java/com/dac/auth/consumer/ComandoAuthListener.java
_(62/62 linhas minhas)_

```java
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
```

### services/conta-service/src/main/java/com/dac/conta/read/entity/ContaR.java
_(61/61 linhas minhas)_

```java
package com.dac.conta.read.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "conta")
public class ContaR {

    @Id
    private String numero;

    @Column(name = "cliente_cpf")
    private String clienteCpf;

    @Column(name = "cliente_nome")
    private String clienteNome;

    @Column(name = "gerente_cpf")
    private String gerenteCpf;

    @Column(name = "gerente_nome")
    private String gerenteNome;

    private BigDecimal saldo;

    private BigDecimal limite;

    private String status;

    @Column(name = "data_criacao")
    private LocalDate dataCriacao;

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getClienteCpf() { return clienteCpf; }
    public void setClienteCpf(String clienteCpf) { this.clienteCpf = clienteCpf; }

    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }

    public String getGerenteCpf() { return gerenteCpf; }
    public void setGerenteCpf(String gerenteCpf) { this.gerenteCpf = gerenteCpf; }

    public String getGerenteNome() { return gerenteNome; }
    public void setGerenteNome(String gerenteNome) { this.gerenteNome = gerenteNome; }

    public BigDecimal getSaldo() { return saldo; }
    public void setSaldo(BigDecimal saldo) { this.saldo = saldo; }

    public BigDecimal getLimite() { return limite; }
    public void setLimite(BigDecimal limite) { this.limite = limite; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDate dataCriacao) { this.dataCriacao = dataCriacao; }
}
```

### services/saga-service/src/main/java/com/dac/saga/util/SagaHttp.java
_(58/58 linhas minhas)_

```java
package com.dac.saga.util;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

// SagaHttp | helper HTTP compartilhado pelos orquestradores de saga para chamar os
// microsserviços participantes (cliente, conta, gerente) via REST.
public final class SagaHttp {

    private static final HttpClient CLIENT = HttpClient.newHttpClient();

    private SagaHttp() {
    }

    public static String get(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .GET()
            .build();
        return enviar(request);
    }

    public static String post(String url, String jsonBody) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();
        return enviar(request);
    }

    public static String put(String url, String jsonBody) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .PUT(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();
        return enviar(request);
    }

    public static String delete(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .DELETE()
            .build();
        return enviar(request);
    }

    private static String enviar(HttpRequest request) throws Exception {
        HttpResponse<String> response = CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
        }
        return response.body();
    }
}
```

### services/saga-service/src/main/java/com/dac/saga/controller/SagaOperacoesController.java
_(57/57 linhas minhas)_

```java
package com.dac.saga.controller;

import com.dac.saga.service.AlteracaoPerfilSagaService;
import com.dac.saga.service.InsercaoGerenteSagaService;
import com.dac.saga.service.RemocaoGerenteSagaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// SagaOperacoesController | dispara as sagas orquestradas de alteração de perfil,
// inserção e remoção de gerente. Endpoints internos chamados serviço-a-serviço
// (cliente-service e gerente-service), nunca expostos pelo gateway.
@RestController
@RequestMapping("/saga")
public class SagaOperacoesController {

    private final AlteracaoPerfilSagaService alteracaoPerfilSaga;
    private final InsercaoGerenteSagaService insercaoGerenteSaga;
    private final RemocaoGerenteSagaService remocaoGerenteSaga;

    public SagaOperacoesController(AlteracaoPerfilSagaService alteracaoPerfilSaga,
                                   InsercaoGerenteSagaService insercaoGerenteSaga,
                                   RemocaoGerenteSagaService remocaoGerenteSaga) {
        this.alteracaoPerfilSaga = alteracaoPerfilSaga;
        this.insercaoGerenteSaga = insercaoGerenteSaga;
        this.remocaoGerenteSaga = remocaoGerenteSaga;
    }

    @PostMapping("/alterar-perfil")
    public ResponseEntity<?> alterarPerfil(@RequestBody Map<String, Object> body) {
        String cpf = (String) body.get("cpf");
        Double novoSalario = body.get("novoSalario") != null
            ? ((Number) body.get("novoSalario")).doubleValue() : null;
        alteracaoPerfilSaga.executar(cpf, novoSalario);
        return ResponseEntity.ok(Map.of("status", "perfil_atualizado"));
    }

    @PostMapping("/inserir-gerente")
    public ResponseEntity<?> inserirGerente(@RequestBody Map<String, Object> body) {
        insercaoGerenteSaga.executar(
            (String) body.get("gerenteCpf"),
            (String) body.get("gerenteNome"),
            (String) body.get("gerenteEmail"),
            (String) body.get("gerenteSenha"),
            (String) body.get("gerenteTipo")
        );
        return ResponseEntity.ok(Map.of("status", "gerente_inserido"));
    }

    @PostMapping("/remover-gerente")
    public ResponseEntity<?> removerGerente(@RequestBody Map<String, Object> body) {
        String cpf = (String) body.get("gerenteCpf");
        remocaoGerenteSaga.executar(cpf);
        return ResponseEntity.ok(Map.of("status", "gerente_removido"));
    }
}
```

### services/conta-service/src/main/java/com/dac/conta/read/entity/MovimentacaoR.java
_(57/57 linhas minhas)_

```java
package com.dac.conta.read.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimentacao")
public class MovimentacaoR {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_hora")
    private LocalDateTime dataHora;

    private String tipo;

    @Column(name = "conta_origem")
    private String contaOrigem;

    @Column(name = "conta_destino")
    private String contaDestino;

    @Column(name = "cliente_origem_cpf")
    private String clienteOrigemCpf;

    @Column(name = "cliente_destino_cpf")
    private String clienteDestinoCpf;

    private BigDecimal valor;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getContaOrigem() { return contaOrigem; }
    public void setContaOrigem(String contaOrigem) { this.contaOrigem = contaOrigem; }

    public String getContaDestino() { return contaDestino; }
    public void setContaDestino(String contaDestino) { this.contaDestino = contaDestino; }

    public String getClienteOrigemCpf() { return clienteOrigemCpf; }
    public void setClienteOrigemCpf(String clienteOrigemCpf) { this.clienteOrigemCpf = clienteOrigemCpf; }

    public String getClienteDestinoCpf() { return clienteDestinoCpf; }
    public void setClienteDestinoCpf(String clienteDestinoCpf) { this.clienteDestinoCpf = clienteDestinoCpf; }

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }
}
```

### services/conta-service/src/main/java/com/dac/conta/config/DataSourceReadConfig.java
_(57/57 linhas minhas)_

```java
package com.dac.conta.config;

import jakarta.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;
import java.util.Properties;

@Configuration
@EnableJpaRepositories(
    basePackages = "com.dac.conta.read.repository",
    entityManagerFactoryRef = "readEntityManagerFactory",
    transactionManagerRef = "readTransactionManager"
)
public class DataSourceReadConfig {

    @Bean
    @ConfigurationProperties(prefix = "spring.datasource-read")
    public DataSource readDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    public LocalContainerEntityManagerFactoryBean readEntityManagerFactory(
            @Qualifier("readDataSource") DataSource readDataSource) {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(readDataSource);
        em.setPackagesToScan("com.dac.conta.read.entity");
        em.setPersistenceUnitName("read");

        HibernateJpaVendorAdapter adapter = new HibernateJpaVendorAdapter();
        adapter.setGenerateDdl(true);
        em.setJpaVendorAdapter(adapter);

        Properties props = new Properties();
        props.setProperty("hibernate.hbm2ddl.auto", "update");
        props.setProperty("hibernate.dialect", "org.hibernate.dialect.PostgreSQLDialect");
        em.setJpaProperties(props);

        return em;
    }

    @Bean
    public PlatformTransactionManager readTransactionManager(
            @Qualifier("readEntityManagerFactory") EntityManagerFactory readEntityManagerFactory) {
        return new JpaTransactionManager(readEntityManagerFactory);
    }
}
```

### services/gerente-service/src/main/java/com/dac/gerente/entity/Gerente.java
_(54/65 linhas minhas)_

```java
package com.dac.gerente.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "gerente")
public class Gerente {

    @Id
    private String cpf;

    private String nome;

    private String email;

    @Enumerated(EnumType.STRING)
    private TipoGerente tipo;

    private String telefone;

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
    
    public TipoGerente getTipo() {
        return tipo;
    }

    public void setTipo(TipoGerente tipo) {
        this.tipo = tipo;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

}```

### services/auth-service/src/main/java/com/dac/auth/controller/InternoController.java
_(54/54 linhas minhas)_

```java
package com.dac.auth.controller;

// service
import com.dac.auth.service.UsuarioService;
// Spring
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// InternoController | endpoints internos chamados serviço-a-serviço pela rede do Docker
// (nunca expostos pelo gateway). Usado pela SAGA de autocadastro para criar o usuário de
// forma síncrona, garantindo que ele exista antes de a aprovação retornar.
@RestController
@RequestMapping("/interno")
public class InternoController {

    private final UsuarioService usuarioService;

    public InternoController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // criarUsuario | cria o usuário de forma idempotente e síncrona
    @PostMapping("/usuario")
    public ResponseEntity<Map<String, String>> criarUsuario(@RequestBody Map<String, String> msg) {
        boolean criado = usuarioService.criarUsuario(
            msg.get("cpf"),
            msg.get("nome"),
            msg.get("email"),
            msg.get("senha"),
            msg.get("tipo")
        );
        return ResponseEntity.ok(Map.of(
            "status", criado ? "criado" : "ja_existia",
            "cpf", msg.getOrDefault("cpf", "")
        ));
    }

    // removerUsuario | ação compensatória das sagas (rollback de criação de usuário)
    @DeleteMapping("/usuario/{cpf}")
    public ResponseEntity<Map<String, String>> removerUsuario(@PathVariable String cpf) {
        boolean removido = usuarioService.removerUsuario(cpf);
        return ResponseEntity.ok(Map.of(
            "status", removido ? "removido" : "nao_encontrado",
            "cpf", cpf
        ));
    }
}
```

### gateway/middlewares/logger.js
_(50/50 linhas minhas)_

```javascript
const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "../logs");
const logFile = path.join(logDir, "access.log");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const getTimestamp = () => new Date().toISOString();

const maskIp = (ip) => {
  if (!ip) return "unknown";
  return ip.replace(/\.\d+$/, ".xxx");
};

const writeLog = (message) => {
  fs.appendFile(logFile, message, (err) => {
    if (err) {
      console.error("[LOGGER ERROR]", err.message);
    }
  });
};

const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  const requestLog = `[INFO] ${getTimestamp()} ${req.method} ${
    req.originalUrl
  } IP:${maskIp(req.ip)}\n`;

  console.log(requestLog.trim());
  writeLog(requestLog);

  res.on("finish", () => {
    const duration = Date.now() - start;

    const responseLog = `[INFO] ${getTimestamp()} ${req.method} ${
      req.originalUrl
    } STATUS:${res.statusCode} TIME:${duration}ms\n`;

    console.log(responseLog.trim());
    writeLog(responseLog);
  });

  next();
};

module.exports = loggerMiddleware;```

### services/cliente-service/src/main/java/com/dac/cliente/service/DevService.java
_(49/49 linhas minhas)_

```java
package com.dac.cliente.service;

import com.dac.cliente.entity.Cliente;
import com.dac.cliente.entity.StatusCliente;
import com.dac.cliente.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DevService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Transactional
    public void resetComMocks() {
        clienteRepository.deleteAll();
        clienteRepository.saveAll(mocks());
    }

    private List<Cliente> mocks() {
        return List.of(
            cliente("12912861012", "Catharyna",   "cli1@bantads.com.br", 10000.0, "Curitiba", "PR", StatusCliente.APROVADO),
            cliente("09506382000", "Cleuddônio",  "cli2@bantads.com.br", 20000.0, "Curitiba", "PR", StatusCliente.APROVADO),
            cliente("85733854057", "Catianna",    "cli3@bantads.com.br",  3000.0, "Curitiba", "PR", StatusCliente.APROVADO),
            cliente("58872160006", "Cutardo",     "cli4@bantads.com.br",   500.0, "Curitiba", "PR", StatusCliente.APROVADO),
            cliente("76179646090", "Coândrya",    "cli5@bantads.com.br",  1500.0, "Curitiba", "PR", StatusCliente.APROVADO)
        );
    }

    private Cliente cliente(String cpf, String nome, String email,
                            Double salario, String cidade, String estado,
                            StatusCliente status) {

        Cliente c = new Cliente();
        c.setCpf(cpf);
        c.setNome(nome);
        c.setEmail(email);
        c.setSalario(salario);
        c.setCidade(cidade);
        c.setEstado(estado);
        c.setStatus(status);

        return c;
    }
}```

### services/saga-service/src/main/java/com/dac/saga/util/SagaCompensacao.java
_(44/44 linhas minhas)_

```java
package com.dac.saga.util;

import java.util.ArrayDeque;
import java.util.Deque;

// SagaCompensacao | pilha de ações compensatórias (undo) de uma saga.
// Cada etapa concluída registra sua ação de reversão; se uma etapa posterior falhar,
// o orquestrador chama compensar() e as reversões são executadas na ordem inversa (LIFO).
public class SagaCompensacao {

    private static final class Acao {
        final String descricao;
        final Runnable undo;
        Acao(String descricao, Runnable undo) {
            this.descricao = descricao;
            this.undo = undo;
        }
    }

    private final Deque<Acao> acoes = new ArrayDeque<>();

    // registrar | empilha a ação compensatória de uma etapa recém-concluída
    public void registrar(String descricao, Runnable undo) {
        acoes.push(new Acao(descricao, undo));
    }

    // compensar | executa todas as reversões pendentes na ordem inversa, sem interromper
    // em caso de erro de uma compensação individual
    public void compensar() {
        while (!acoes.isEmpty()) {
            Acao acao = acoes.pop();
            try {
                System.out.println("Saga: compensando etapa - " + acao.descricao);
                acao.undo.run();
            } catch (Exception e) {
                System.err.println("Saga: falha ao compensar '" + acao.descricao + "': " + e.getMessage());
            }
        }
    }

    public boolean temPendencias() {
        return !acoes.isEmpty();
    }
}
```

### services/auth-service/src/main/java/com/dac/auth/listener/RebootListener.java
_(43/45 linhas minhas)_

```java
package com.dac.auth.listener;

// Spring AMQP / RabbitMQ
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class RebootListener {

    @Autowired
    private MongoTemplate mongo;

    // onReboot | escuta fila de reset do saga-service e recria a coleção auth com dados mock
    @RabbitListener(queues = "${rabbitmq.fila.reset:saga.reset}",
                    containerFactory = "rabbitListenerContainerFactory")
    public void onReboot(String mensagem) {
        try {
            mongo.dropCollection("auth");

            List<Map<String, Object>> usuarios = new ArrayList<>();
            usuarios.add(new HashMap<>(Map.of("cpf","12912861012","email","cli1@bantads.com.br","senhaHash","tads","tipo","cliente")));
            usuarios.add(new HashMap<>(Map.of("cpf","09506382000","email","cli2@bantads.com.br","senhaHash","tads","tipo","cliente")));
            usuarios.add(new HashMap<>(Map.of("cpf","85733854057","email","cli3@bantads.com.br","senhaHash","tads","tipo","cliente")));
            usuarios.add(new HashMap<>(Map.of("cpf","58872160006","email","cli4@bantads.com.br","senhaHash","tads","tipo","cliente")));
            usuarios.add(new HashMap<>(Map.of("cpf","76179646090","email","cli5@bantads.com.br","senhaHash","tads","tipo","cliente")));
            usuarios.add(new HashMap<>(Map.of("cpf","98574307084","email","ger1@bantads.com.br","senhaHash","tads","tipo","gerente")));
            usuarios.add(new HashMap<>(Map.of("cpf","64065268052","email","ger2@bantads.com.br","senhaHash","tads","tipo","gerente")));
            usuarios.add(new HashMap<>(Map.of("cpf","23862179060","email","ger3@bantads.com.br","senhaHash","tads","tipo","gerente")));
            usuarios.add(new HashMap<>(Map.of("cpf","40501740066","email","adm1@bantads.com.br","senhaHash","tads","tipo","administrador")));

            mongo.insert(usuarios, "auth");
            System.out.println("auth-service: reboot concluido com sucesso");
        } catch (Exception e) {
            System.err.println("auth-service: erro no reboot - " + e.getMessage());
            throw e;
        }
    }
}```

### services/conta-service/src/main/java/com/dac/conta/listener/ClienteEventoListener.java
_(43/43 linhas minhas)_

```java
package com.dac.conta.listener;

import com.dac.conta.dto.request.AtualizarLimiteRequestDTO;
import com.dac.conta.service.ContaService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ClienteEventoListener {

    @Autowired
    private ContaService contaService;

    // Escuta evento publicado pelo cliente-service quando salário é alterado (R4)
    @RabbitListener(queues = "${rabbitmq.fila.limite:conta.limite}",
                    containerFactory = "rabbitListenerContainerFactory")
    public void onAtualizarLimite(Map<String, Object> evento) {
        try {
            String cpf = (String) evento.get("cpf");
            Object salarioObj = evento.get("novoSalario");

            if (cpf == null || salarioObj == null) {
                System.err.println("conta-service: evento de limite inválido - cpf ou salario nulos");
                return;
            }

            Double novoSalario = ((Number) salarioObj).doubleValue();

            AtualizarLimiteRequestDTO request = new AtualizarLimiteRequestDTO();
            request.setClienteCpf(cpf);
            request.setNovoSalario(novoSalario);

            contaService.atualizarLimite(request);
            System.out.println("conta-service: limite atualizado para cliente " + cpf);
        } catch (Exception e) {
            System.err.println("conta-service: erro ao atualizar limite - " + e.getMessage());
            throw e;
        }
    }
}```

### services/gerente-service/src/main/java/com/dac/gerente/service/DevService.java
_(41/41 linhas minhas)_

```java
package com.dac.gerente.service;

import com.dac.gerente.entity.Gerente;
import com.dac.gerente.entity.TipoGerente;
import com.dac.gerente.repository.GerenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DevService {

    @Autowired
    private GerenteRepository gerenteRepository;

    @Transactional
    public void resetComMocks() {
        gerenteRepository.deleteAll();
        gerenteRepository.saveAll(mocks());
    }

    private List<Gerente> mocks() {
        return List.of(
            gerente("98574307084", "Geniéve",   "ger1@bantads.com.br", TipoGerente.GERENTE),
            gerente("64065268052", "Godophredo", "ger2@bantads.com.br", TipoGerente.GERENTE),
            gerente("23862179060", "Gyândula",   "ger3@bantads.com.br", TipoGerente.GERENTE),
            gerente("40501740066", "Adamântio",  "adm1@bantads.com.br", TipoGerente.ADMINISTRADOR)
        );
    }

    private Gerente gerente(String cpf, String nome, String email, TipoGerente tipo) {
        Gerente g = new Gerente();
        g.setCpf(cpf);
        g.setNome(nome);
        g.setEmail(email);
        g.setTipo(tipo);
        return g;
    }
}```

### services/conta-service/src/main/java/com/dac/conta/dto/evento/ContaAtualizadaEvento.java
_(41/41 linhas minhas)_

```java
package com.dac.conta.dto.evento;

import java.math.BigDecimal;

public class ContaAtualizadaEvento {

    private String numero;
    private String clienteCpf;
    private String clienteNome;
    private String gerenteCpf;
    private String gerenteNome;
    private BigDecimal saldo;
    private BigDecimal limite;
    private String status;

    public ContaAtualizadaEvento() {}

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getClienteCpf() { return clienteCpf; }
    public void setClienteCpf(String clienteCpf) { this.clienteCpf = clienteCpf; }

    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }

    public String getGerenteCpf() { return gerenteCpf; }
    public void setGerenteCpf(String gerenteCpf) { this.gerenteCpf = gerenteCpf; }

    public String getGerenteNome() { return gerenteNome; }
    public void setGerenteNome(String gerenteNome) { this.gerenteNome = gerenteNome; }

    public BigDecimal getSaldo() { return saldo; }
    public void setSaldo(BigDecimal saldo) { this.saldo = saldo; }

    public BigDecimal getLimite() { return limite; }
    public void setLimite(BigDecimal limite) { this.limite = limite; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}```

### services/conta-service/src/main/java/com/dac/conta/dto/evento/MovimentacaoCriadaEvento.java
_(38/38 linhas minhas)_

```java
package com.dac.conta.dto.evento;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MovimentacaoCriadaEvento {

    private String tipo;
    private String contaOrigem;
    private String contaDestino;
    private String clienteOrigemCpf;
    private String clienteDestinoCpf;
    private BigDecimal valor;
    private LocalDateTime dataHora;

    public MovimentacaoCriadaEvento() {}

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getContaOrigem() { return contaOrigem; }
    public void setContaOrigem(String contaOrigem) { this.contaOrigem = contaOrigem; }

    public String getContaDestino() { return contaDestino; }
    public void setContaDestino(String contaDestino) { this.contaDestino = contaDestino; }

    public String getClienteOrigemCpf() { return clienteOrigemCpf; }
    public void setClienteOrigemCpf(String clienteOrigemCpf) { this.clienteOrigemCpf = clienteOrigemCpf; }

    public String getClienteDestinoCpf() { return clienteDestinoCpf; }
    public void setClienteDestinoCpf(String clienteDestinoCpf) { this.clienteDestinoCpf = clienteDestinoCpf; }

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }

    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
}```

### services/conta-service/src/main/java/com/dac/conta/repository/ContaCUDRepository.java
_(34/41 linhas minhas)_

```java
package com.dac.conta.repository;

import com.dac.conta.entity.ContaCUD;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContaCUDRepository extends JpaRepository<ContaCUD, String> {

    List<ContaCUD> findByGerenteCpf(String gerenteCpf);

    Optional<ContaCUD> findByClienteCpf(String clienteCpf);

    // Contagem de contas por gerente: { cpfGerente -> quantidade }
    @Query("SELECT c.gerenteCpf, COUNT(c) FROM ContaCUD c GROUP BY c.gerenteCpf")
    List<Object[]> contarContasPorGerente();

    // Soma de saldos positivos por gerente: saldo > 0 → saldo; saldo = 0 → limite; saldo < 0 → 0
    @Query("SELECT c.gerenteCpf, COALESCE(SUM(CASE WHEN c.saldo > 0 THEN c.saldo WHEN c.saldo = 0 THEN c.limite ELSE 0 END), 0) " +
           "FROM ContaCUD c GROUP BY c.gerenteCpf")
    List<Object[]> somarSaldosPositivosPorGerente();

    // Soma de saldos negativos por gerente: { cpfGerente -> somaNegativo }
    @Query("SELECT c.gerenteCpf, COALESCE(SUM(CASE WHEN c.saldo < 0 THEN c.saldo ELSE 0 END), 0) " +
           "FROM ContaCUD c GROUP BY c.gerenteCpf")
    List<Object[]> somarSaldosNegativosPorGerente();

    // Conta com menor número de contas excluindo um gerente específico
    @Query("SELECT c.gerenteCpf FROM ContaCUD c WHERE c.gerenteCpf <> :excluir " +
           "GROUP BY c.gerenteCpf ORDER BY COUNT(c) ASC")
    List<String> gerentesOrdenadosPorQuantidadeExcluindo(@Param("excluir") String excluir);

    // Buscar uma conta do gerente origem para redistribuir
    @Query("SELECT c FROM ContaCUD c WHERE c.gerenteCpf = :gerenteCpf ORDER BY c.numero ASC")
    List<ContaCUD> findByGerenteCpfOrdenado(@Param("gerenteCpf") String gerenteCpf);
}```

### gateway/utils/logFormatter.js
_(33/33 linhas minhas)_

```javascript
const getTimestamp = () => {
    return new Date().toISOString();
};

const formatRequestLog = (req) => {
    return {
        timestamp: getTimestamp(),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || 'unknown'
    };
};

const formatResponseLog = (req, res, duration) => {
    return {
        timestamp: getTimestamp(),
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`
    };
};

const toLogString = (level, data) => {
    return `[${level}] ${JSON.stringify(data)}\n`;
};

module.exports = {
    formatRequestLog,
    formatResponseLog,
    toLogString
};```

### services/saga-service/src/main/java/com/dac/saga/bus/RespostaSagaListener.java
_(32/32 linhas minhas)_

```java
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

    @SuppressWarnings("unchecked")
    @RabbitListener(queues = RabbitMQConfig.FILA_RESPOSTA, containerFactory = "rabbitListenerContainerFactory")
    public void onResposta(Map<String, Object> msg) {
        RespostaComando resposta = new RespostaComando();
        resposta.setCorrelationId((String) msg.get("correlationId"));
        resposta.setSucesso(Boolean.TRUE.equals(msg.get("sucesso")));
        resposta.setErro((String) msg.get("erro"));
        Object dados = msg.get("dados");
        if (dados instanceof Map) {
            resposta.setDados((Map<String, Object>) dados);
        }
        bus.completar(resposta);
    }
}
```

### services/saga-service/src/main/resources/application.yml
_(28/28 linhas minhas)_

```yaml
server:
  port: 8080
  error:
    include-message: always
    include-binding-errors: always

spring:
  application:
    name: saga-service

  rabbitmq:
    host: rabbitmq
    port: 5672
    username: guest
    password: guest

saga:
  services:
    cliente: http://cliente-service:8080
    gerente: http://gerente-service:8080
    conta:   http://conta-service:8080
    auth:    http://auth-service:8080

management:
  endpoints:
    web:
      exposure:
        include: health```

### services/auth-service/src/main/java/com/dac/auth/controller/DevController.java
_(25/41 linhas minhas)_

```java
package com.dac.auth.controller;

// Spring
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reboot")
public class DevController {

    @Autowired
    private MongoTemplate mongo;

    // resetDatabase | apaga e recria a coleção auth com os usuários mock de desenvolvimento
    @PostMapping
    public String resetDatabase() {
        mongo.dropCollection("auth");

        // usuários mock: clientes, gerentes e admin
        List<Map<String, Object>> usuarios = new ArrayList<>();
        usuarios.add(new HashMap<>(Map.of("cpf","12912861012","email","cli1@bantads.com.br","senhaHash","tads","tipo","cliente")));
        usuarios.add(new HashMap<>(Map.of("cpf","09506382000","email","cli2@bantads.com.br","senhaHash","tads","tipo","cliente")));
        usuarios.add(new HashMap<>(Map.of("cpf","85733854057","email","cli3@bantads.com.br","senhaHash","tads","tipo","cliente")));
        usuarios.add(new HashMap<>(Map.of("cpf","58872160006","email","cli4@bantads.com.br","senhaHash","tads","tipo","cliente")));
        usuarios.add(new HashMap<>(Map.of("cpf","76179646090","email","cli5@bantads.com.br","senhaHash","tads","tipo","cliente")));
        usuarios.add(new HashMap<>(Map.of("cpf","98574307084","email","ger1@bantads.com.br","senhaHash","tads","tipo","gerente")));
        usuarios.add(new HashMap<>(Map.of("cpf","64065268052","email","ger2@bantads.com.br","senhaHash","tads","tipo","gerente")));
        usuarios.add(new HashMap<>(Map.of("cpf","23862179060","email","ger3@bantads.com.br","senhaHash","tads","tipo","gerente")));
        usuarios.add(new HashMap<>(Map.of("cpf","40501740066","email","adm1@bantads.com.br","senhaHash","tads","tipo","administrador")));

        mongo.insert(usuarios, "auth");

        return "Banco auth recriado com mocks (Prioridade HEAD)";
    }
}```

### services/saga-service/src/main/java/com/dac/saga/controller/DevSenhaController.java
_(25/25 linhas minhas)_

```java
package com.dac.saga.controller;

import com.dac.saga.service.AutocadastroSagaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/saga")
public class DevSenhaController {

    private final AutocadastroSagaService service;

    public DevSenhaController(AutocadastroSagaService service) {
        this.service = service;
    }

    @GetMapping("/senha/{cpf}")
    public ResponseEntity<?> getSenha(@PathVariable String cpf) {
        String senha = service.getSenhaPorCpf(cpf);
        if (senha == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("senha", senha));
    }
}
```

### services/gerente-service/src/main/java/com/dac/gerente/listener/RebootListener.java
_(25/25 linhas minhas)_

```java
package com.dac.gerente.listener;

import com.dac.gerente.service.DevService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class RebootListener {

    @Autowired
    private DevService devService;

    @RabbitListener(queues = "${rabbitmq.fila.reset:saga.reset}",
                    containerFactory = "rabbitListenerContainerFactory")
    public void onReboot(String mensagem) {
        try {
            devService.resetComMocks();
            System.out.println("gerente-service: reboot concluido com sucesso");
        } catch (Exception e) {
            System.err.println("gerente-service: erro no reboot - " + e.getMessage());
            throw e;
        }
    }
}```

### services/conta-service/src/main/java/com/dac/conta/listener/RebootListener.java
_(25/25 linhas minhas)_

```java
package com.dac.conta.listener;

import com.dac.conta.service.DevService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class RebootListener {

    @Autowired
    private DevService devService;

    @RabbitListener(queues = "${rabbitmq.fila.reset:saga.reset}",
                    containerFactory = "rabbitListenerContainerFactory")
    public void onReboot(String mensagem) {
        try {
            devService.resetComMocks();
            System.out.println("conta-service: reboot concluido com sucesso");
        } catch (Exception e) {
            System.err.println("conta-service: erro no reboot - " + e.getMessage());
            throw e;
        }
    }
}```

### services/cliente-service/src/main/java/com/dac/cliente/listener/RebootListener.java
_(25/25 linhas minhas)_

```java
package com.dac.cliente.listener;

import com.dac.cliente.service.DevService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class RebootListener {

    @Autowired
    private DevService devService;

    @RabbitListener(queues = "${rabbitmq.fila.reset:saga.reset}",
                    containerFactory = "rabbitListenerContainerFactory")
    public void onReboot(String mensagem) {
        try {
            devService.resetComMocks();
            System.out.println("cliente-service: reboot concluido com sucesso");
        } catch (Exception e) {
            System.err.println("cliente-service: erro no reboot - " + e.getMessage());
            throw e;
        }
    }
}```

### services/saga-service/src/main/java/com/dac/saga/bus/RespostaComando.java
_(24/24 linhas minhas)_

```java
package com.dac.saga.bus;

import java.util.Map;

// RespostaComando | resposta de um serviço a um comando da saga, correlacionada pelo correlationId
public class RespostaComando {

    private String correlationId;
    private boolean sucesso;
    private String erro;
    private Map<String, Object> dados;

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public boolean isSucesso() { return sucesso; }
    public void setSucesso(boolean sucesso) { this.sucesso = sucesso; }

    public String getErro() { return erro; }
    public void setErro(String erro) { this.erro = erro; }

    public Map<String, Object> getDados() { return dados; }
    public void setDados(Map<String, Object> dados) { this.dados = dados; }
}
```

### services/conta-service/src/main/java/com/dac/conta/read/repository/ContaRRepository.java
_(23/23 linhas minhas)_

```java
package com.dac.conta.read.repository;

import com.dac.conta.read.entity.ContaR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContaRRepository extends JpaRepository<ContaR, String> {

    Optional<ContaR> findByClienteCpf(String clienteCpf);

    List<ContaR> findByGerenteCpf(String gerenteCpf);

    @Query("SELECT c.gerenteCpf, " +
           "COALESCE(SUM(CASE WHEN c.saldo >= 0 THEN c.saldo ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN c.saldo < 0 THEN c.saldo ELSE 0 END), 0), " +
           "COUNT(c) FROM ContaR c GROUP BY c.gerenteCpf")
    List<Object[]> resumoPorGerente();
}
```

### services/cliente-service/src/main/java/com/dac/cliente/repository/ClienteRepository.java
_(22/27 linhas minhas)_

```java
package com.dac.cliente.repository;

import com.dac.cliente.entity.Cliente;
import com.dac.cliente.entity.StatusCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, String> {

    List<Cliente> findByStatus(StatusCliente status);

    List<Cliente> findByStatusOrderByNomeAsc(StatusCliente status);

    List<Cliente> findAllByOrderByNomeAsc();

    boolean existsByEmail(String email);

    @Query("SELECT c FROM Cliente c WHERE c.status = :status AND " +
           "(LOWER(c.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR c.cpf LIKE CONCAT('%', :termo, '%'))")
    List<Cliente> buscarPorCpfOuNome(@Param("status") StatusCliente status,
                                      @Param("termo") String termo);
}```

### services/conta-service/src/main/java/com/dac/conta/dto/request/RedistribuirRequestDTO.java
_(20/20 linhas minhas)_

```java
package com.dac.conta.dto.request;

public class RedistribuirRequestDTO {
    private String gerenteOrigemCpf;
    private String gerenteDestinoCpf;
    private String gerenteDestinoNome;
    private int quantidade; // 1 = transfere 1 conta, -1 = transfere todas

    public String getGerenteOrigemCpf() { return gerenteOrigemCpf; }
    public void setGerenteOrigemCpf(String gerenteOrigemCpf) { this.gerenteOrigemCpf = gerenteOrigemCpf; }

    public String getGerenteDestinoCpf() { return gerenteDestinoCpf; }
    public void setGerenteDestinoCpf(String gerenteDestinoCpf) { this.gerenteDestinoCpf = gerenteDestinoCpf; }

    public String getGerenteDestinoNome() { return gerenteDestinoNome; }
    public void setGerenteDestinoNome(String gerenteDestinoNome) { this.gerenteDestinoNome = gerenteDestinoNome; }

    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }
}```

### services/gerente-service/src/main/java/com/dac/gerente/controller/DevController.java
_(19/19 linhas minhas)_

```java
package com.dac.gerente.controller;

import com.dac.gerente.service.DevService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reboot")
public class DevController {

    @Autowired
    private DevService devService;

    @PostMapping
    public String resetDatabase() {
        devService.resetComMocks();
        return "Banco gerente recriado com mocks";
    }
}```

### services/conta-service/src/main/java/com/dac/conta/read/repository/MovimentacaoRRepository.java
_(19/19 linhas minhas)_

```java
package com.dac.conta.read.repository;

import com.dac.conta.read.entity.MovimentacaoR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimentacaoRRepository extends JpaRepository<MovimentacaoR, Long> {

    List<MovimentacaoR> findByContaOrigemOrContaDestinoOrderByDataHoraAsc(
        String contaOrigem, String contaDestino);

    List<MovimentacaoR> findByContaOrigemOrContaDestinoAndDataHoraBetweenOrderByDataHoraAsc(
        String contaOrigem, String contaDestino,
        LocalDateTime inicio, LocalDateTime fim);
}
```

### services/conta-service/src/main/java/com/dac/conta/controller/DevController.java
_(19/19 linhas minhas)_

```java
package com.dac.conta.controller;

import com.dac.conta.service.DevService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reboot")
public class DevController {

    @Autowired
    private DevService devService;

    @PostMapping
    public String resetDatabase() {
        devService.resetComMocks();
        return "Banco conta recriado com mocks";
    }
}```

### services/cliente-service/src/main/java/com/dac/cliente/controller/DevController.java
_(19/19 linhas minhas)_

```java
package com.dac.cliente.controller;

import com.dac.cliente.service.DevService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reboot")
public class DevController {

    @Autowired
    private DevService devService;

    @PostMapping
    public String resetDatabase() {
        devService.resetComMocks();
        return "Banco cliente recriado com mocks";
    }
}```

### services/saga-service/src/main/java/com/dac/saga/controller/HealthController.java
_(16/16 linhas minhas)_

```java
package com.dac.saga.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}```

### services/conta-service/src/main/java/com/dac/conta/dto/request/CriarContaRequestDTO.java
_(12/24 linhas minhas)_

```java
package com.dac.conta.dto.request;

public class CriarContaRequestDTO {
    private String clienteCpf;
    private String clienteNome;
    private String gerenteCpf;
    private String gerenteNome;
    private Double limite;

    public String getClienteCpf() { return clienteCpf; }
    public void setClienteCpf(String clienteCpf) { this.clienteCpf = clienteCpf; }

    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }

    public String getGerenteCpf() { return gerenteCpf; }
    public void setGerenteCpf(String gerenteCpf) { this.gerenteCpf = gerenteCpf; }

    public String getGerenteNome() { return gerenteNome; }
    public void setGerenteNome(String gerenteNome) { this.gerenteNome = gerenteNome; }

    public Double getLimite() { return limite; }
    public void setLimite(Double limite) { this.limite = limite; }
}```

### services/saga-service/src/main/java/com/dac/saga/SagaServiceApplication.java
_(12/12 linhas minhas)_

```java
package com.dac.saga;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SagaServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SagaServiceApplication.class, args);
    }
}```

### services/conta-service/src/main/java/com/dac/conta/repository/MovimentacaoCUDRepository.java
_(9/9 linhas minhas)_

```java
package com.dac.conta.repository;

import com.dac.conta.entity.MovimentacaoCUD;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimentacaoCUDRepository extends JpaRepository<MovimentacaoCUD, Long> {
}```

### services/gerente-service/src/main/java/com/dac/gerente/repository/GerenteRepository.java
_(9/17 linhas minhas)_

```java
package com.dac.gerente.repository;

import com.dac.gerente.entity.Gerente;
import com.dac.gerente.entity.TipoGerente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GerenteRepository extends JpaRepository<Gerente, String> {
    boolean existsByEmail(String email);
    boolean existsByEmailAndCpfNot(String email, String cpf);
    List<Gerente> findAllByOrderByNomeAsc();
    List<Gerente> findByTipo(TipoGerente tipo);
    long countByTipo(TipoGerente tipo);
}```

### services/cliente-service/src/main/resources/create-cliente-db.sql
_(7/7 linhas minhas)_

```sql
-- Script executado no startup do cliente-service
-- Cria o banco apenas se ainda não existir
SELECT 'CREATE DATABASE cliente_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'cliente_db'
)\gexec
 ```

### services/gerente-service/src/main/resources/create-gerente-db.sql
_(6/6 linhas minhas)_

```sql
-- Script executado no startup do gerente-service
-- Cria o banco apenas se ainda não existir
SELECT 'CREATE DATABASE gerente_db'
WHERE NOT EXISTS (
    SELECT FROM pg_database WHERE datname = 'gerente_db'
)\gexec```

### services/conta-service/src/main/java/com/dac/conta/repository/MovimentacaoRRepository.java
_(4/4 linhas minhas)_

```java
package com.dac.conta.repository;

// Movido para com.dac.conta.read.repository.MovimentacaoRRepository
// Este arquivo existe apenas para não quebrar o histórico git.
```

### services/conta-service/src/main/java/com/dac/conta/repository/ContaRRepository.java
_(4/4 linhas minhas)_

```java
package com.dac.conta.repository;

// Movido para com.dac.conta.read.repository.ContaRRepository
// Este arquivo existe apenas para não quebrar o histórico git.
```

### services/conta-service/src/main/java/com/dac/conta/entity/MovimentacaoR.java
_(2/4 linhas minhas)_

```java
package com.dac.conta.entity;

// Movido para com.dac.conta.read.entity.MovimentacaoR
// Este arquivo existe apenas para não quebrar o histórico git.
```

### services/conta-service/src/main/java/com/dac/conta/entity/ContaR.java
_(2/4 linhas minhas)_

```java
package com.dac.conta.entity;

// Movido para com.dac.conta.read.entity.ContaR
// Este arquivo existe apenas para não quebrar o histórico git.
```

### services/conta-service/src/main/resources/create-conta-db.sql
_(2/2 linhas minhas)_

```sql
CREATE DATABASE conta_cud_db;
CREATE DATABASE conta_r_db;```

---

## 2. Contribuições pontuais (arquivos compartilhados)

Escrevi parte do código; o restante é de colegas. Número = linhas minhas na versão final:

- **services/saga-service/src/main/java/com/dac/saga/service/AutocadastroSagaService.java** — 110/254 linhas
- **docker-compose.yml** — 49/209 linhas
- **services/gerente-service/src/main/java/com/dac/gerente/service/GerenteService.java** — 27/284 linhas
- **services/saga-service/src/main/java/com/dac/saga/service/ResetService.java** — 23/63 linhas
- **services/auth-service/src/main/java/com/dac/auth/service/AuthService.java** — 20/119 linhas
- **services/cliente-service/src/main/java/com/dac/cliente/entity/Cliente.java** — 16/131 linhas
- **services/conta-service/src/main/java/com/dac/conta/entity/ContaCUD.java** — 16/100 linhas
- **services/auth-service/src/main/java/com/dac/auth/consumer/AuthConsumer.java** — 14/83 linhas
- **gateway/server.js** — 14/285 linhas
- **services/gerente-service/src/main/resources/application.yml** — 10/38 linhas
- **services/conta-service/src/main/resources/application.yml** — 10/38 linhas
- **services/conta-service/src/main/java/com/dac/conta/dto/request/AtualizarLimiteRequestDTO.java** — 7/16 linhas
- **services/auth-service/src/main/java/com/dac/auth/controller/AuthController.java** — 6/220 linhas
- **frontend/src/App.jsx** — 6/133 linhas
- **services/saga-service/src/main/java/com/dac/saga/controller/RebootController.java** — 5/35 linhas
- **frontend/src/lib/RotaProtegida.jsx** — 5/26 linhas
---

## 3. Detalhe — minhas alterações nas sagas de autoria mista

Estes arquivos têm o esqueleto original de colega, mas eu reescrevi partes importantes na versão final.

### AutocadastroSagaService.java (110/254 linhas minhas)

Minhas mudanças: pilha de **compensação (rollback)**, criação síncrona do usuário no auth e migração das etapas para **comando/resposta via RabbitMQ** (`commandBus`). Arquivo final completo:

```java
package com.dac.saga.service;

import com.dac.saga.bus.SagaCommandBus;
import com.dac.saga.util.SagaCompensacao;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AutocadastroSagaService {

    @Value("${saga.services.gerente}")
    private String gerenteUrl;

    @Value("${saga.services.conta}")
    private String contaUrl;

    @Value("${saga.services.auth}")
    private String authUrl;

    private final RabbitTemplate rabbitTemplate;
    private final SagaCommandBus commandBus;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, String> senhasPorCpf = new ConcurrentHashMap<>();

    public AutocadastroSagaService(RabbitTemplate rabbitTemplate, SagaCommandBus commandBus) {
        this.rabbitTemplate = rabbitTemplate;
        this.commandBus = commandBus;
    }

    public String getSenhaPorCpf(String cpf) {
        return senhasPorCpf.get(cpf);
    }

    public void processarAprovacao(Map<String, Object> evento) {
        String cpf = normalizarDocumento((String) evento.get("cpf"));
        String nome = texto((String) evento.get("nome"));
        String email = texto((String) evento.get("email"));
        Double limite = paraDouble(evento.get("limite"), 0.0);

        if (cpf == null || cpf.length() != 11) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF inválido para aprovação");
        }
        if (nome == null || nome.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome obrigatório para aprovação");
        }
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email obrigatório para aprovação");
        }

        Map<String, Object> gerente = selecionarGerenteComMenosClientes();
        String gerenteCpf = normalizarDocumento((String) gerente.get("cpf"));
        String gerenteNome = texto((String) gerente.get("nome"));

        String senhaTemporaria = gerarSenha();
        SagaCompensacao compensacao = new SagaCompensacao();

        try {
            // Etapa 1 (MS Conta): cria a conta. Compensação: remover a conta criada.
            criarConta(cpf, nome, gerenteCpf, gerenteNome, limite);
            compensacao.registrar("remover conta do cliente " + cpf, () -> removerContaNoConta(cpf));

            // Etapa 2 (MS Auth): cria o usuário de forma síncrona (garante login imediato).
            // Compensação: remover o usuário criado no auth.
            senhasPorCpf.put(cpf, senhaTemporaria);
            criarUsuarioNoAuthSincrono(cpf, nome, email, senhaTemporaria);
            compensacao.registrar("remover usuário auth do cliente " + cpf, () -> removerUsuarioNoAuth(cpf));

            // Etapa 3 (mensageria): publica o evento na fila. O consumer é idempotente,
            // então a mensagem apenas confirma — não duplica o usuário.
            publicarUsuarioNoAuth(cpf, nome, email, senhaTemporaria);
        } catch (RuntimeException e) {
            System.err.println("Saga autocadastro: falha — executando compensação. Causa: " + e.getMessage());
            compensacao.compensar();
            senhasPorCpf.remove(cpf);
            publicarEventoSaga("autocadastro.falha", cpf);
            throw e;
        }

        System.out.println("Saga aprovação: conta criada e senha enviada para " + email + " - Senha: " + senhaTemporaria);
    }

    private Map<String, Object> selecionarGerenteComMenosClientes() {
        try {
            String gerentesJson = httpGet(gerenteUrl + "/gerentes");
            List<Map<String, Object>> gerentes = objectMapper.readValue(
                gerentesJson, new TypeReference<List<Map<String, Object>>>() {});

            List<Map<String, Object>> ativos = gerentes.stream()
                .filter(g -> "GERENTE".equalsIgnoreCase(texto((String) g.get("tipo"))))
                .toList();

            if (ativos.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Nenhum gerente disponível para aprovação");
            }

            String contagemJson = httpGet(contaUrl + "/contas/contagem-por-gerente");
            Map<String, Number> contagem = objectMapper.readValue(
                contagemJson, new TypeReference<Map<String, Number>>() {});

            return ativos.stream()
                .min(Comparator
                    .comparingLong((Map<String, Object> g) -> contagem.getOrDefault(g.get("cpf"), 0).longValue())
                    .thenComparing(g -> (String) g.get("cpf")))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Falha ao escolher gerente"));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro ao selecionar gerente: " + e.getMessage(), e);
        }
    }

    // Etapa MS Conta via comando assíncrono (RabbitMQ): orquestrador publica o comando e
    // aguarda a resposta correlacionada.
    private void criarConta(String clienteCpf, String clienteNome, String gerenteCpf, String gerenteNome, Double limite) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("clienteCpf", clienteCpf);
        payload.put("clienteNome", clienteNome);
        payload.put("gerenteCpf", gerenteCpf);
        payload.put("gerenteNome", gerenteNome);
        payload.put("limite", limite != null && limite >= 0 ? limite : 0.0);
        commandBus.enviarEAguardar("comando.conta.criar", "criar_conta", payload);
    }

    // Etapa MS Auth via comando assíncrono (RabbitMQ).
    private void criarUsuarioNoAuthSincrono(String cpf, String nome, String email, String senhaTemporaria) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("cpf", cpf);
        payload.put("nome", nome);
        payload.put("email", email.toLowerCase(Locale.ROOT));
        payload.put("senha", senhaTemporaria);
        payload.put("tipo", "cliente");
        commandBus.enviarEAguardar("comando.auth.criar", "criar_usuario", payload);
    }

    private void publicarUsuarioNoAuth(String cpf, String nome, String email, String senhaTemporaria) {
        Map<String, String> authEvento = new HashMap<>();
        authEvento.put("acao", "criar");
        authEvento.put("cpf", cpf);
        authEvento.put("nome", nome);
        authEvento.put("email", email.toLowerCase(Locale.ROOT));
        authEvento.put("senha", senhaTemporaria);
        authEvento.put("tipo", "cliente");
        rabbitTemplate.convertAndSend("auth.exchange", "auth.criar", authEvento);
    }

    // Ação compensatória (comando assíncrono): remove a conta criada nesta saga.
    private void removerContaNoConta(String cpf) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("clienteCpf", cpf);
        commandBus.enviarEAguardar("comando.conta.remover", "remover_conta", payload);
    }

    // Ação compensatória (comando assíncrono): remove o usuário criado no auth nesta saga.
    private void removerUsuarioNoAuth(String cpf) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("cpf", cpf);
        commandBus.enviarEAguardar("comando.auth.remover", "remover_usuario", payload);
    }

    private void publicarEventoSaga(String routingKey, String cpf) {
        try {
            Map<String, Object> evento = new HashMap<>();
            evento.put("saga", "autocadastro");
            evento.put("cpf", cpf);
            rabbitTemplate.convertAndSend("saga.exchange", routingKey, evento);
        } catch (Exception ignored) {
            // evento de acompanhamento é best-effort
        }
    }

    private String httpDelete(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .DELETE()
            .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
        }
        return response.body();
    }

    private String httpGet(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .GET()
            .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
        }
        return response.body();
    }

    private String httpPost(String url, String jsonBody) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
        }
        return response.body();
    }

    private String gerarSenha() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private String normalizarDocumento(String valor) {
        return valor == null ? null : valor.replaceAll("\\D", "");
    }

    private String texto(String valor) {
        return valor == null ? null : valor.trim();
    }

    private Double paraDouble(Object valor, Double padrao) {
        if (valor == null) return padrao;
        if (valor instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(valor.toString());
        } catch (Exception e) {
            return padrao;
        }
    }
}```

### GerenteService.java — métodos cadastrar() e remover() (versão final)

Fiz a inserção/remoção **delegarem para as sagas orquestradas** (a redistribuição saiu daqui e foi para o orquestrador):

```java
    public DadoGerente cadastrar(GerenteInsercao dto) {
        if (gerenteRepository.existsById(dto.getCpf())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "CPF já cadastrado");
        }
        if (gerenteRepository.existsByEmail(dto.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }

        Gerente gerente = new Gerente();
        gerente.setCpf(dto.getCpf());
        gerente.setNome(dto.getNome());
        gerente.setEmail(dto.getEmail());
        gerente.setTelefone(dto.getTelefone());

        String tipoNormalizado = dto.getTipo() == null ? "" : dto.getTipo().trim().toLowerCase();
        if (tipoNormalizado.isEmpty() || "gerente".equals(tipoNormalizado)) {
            gerente.setTipo(TipoGerente.GERENTE);
            tipoNormalizado = "gerente";
        } else if ("administrador".equals(tipoNormalizado)) {
            gerente.setTipo(TipoGerente.ADMINISTRADOR);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo inválido: use 'gerente' ou 'administrador'");
        }

        gerenteRepository.save(gerente);

        // Dispara a SAGA de inserção de gerente (orquestrada pelo saga-service): cria o usuário
        // no auth e atribui uma conta ao novo gerente. Se a saga falhar, a exceção propaga e o
        // @Transactional reverte o registro do gerente recém-salvo (compensação local).
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("gerenteCpf", dto.getCpf());
            body.put("gerenteNome", dto.getNome());
            body.put("gerenteEmail", dto.getEmail());
            body.put("gerenteSenha", dto.getSenha());
            body.put("gerenteTipo", tipoNormalizado);
            httpPost(sagaUrl + "/saga/inserir-gerente", objectMapper.writeValueAsString(body));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Falha na saga de inserção de gerente: " + e.getMessage());
        }

        return toDTO(gerente);
    }

    public DadoGerente remover(String cpf) {
        Gerente gerente = gerenteRepository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gerente não encontrado"));

        long totalGerentes = gerenteRepository.countByTipo(TipoGerente.GERENTE);
        if (totalGerentes <= 1 && gerente.getTipo() == TipoGerente.GERENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Não é permitido remover o último gerente do banco");
        }

        if (gerente.getTipo() == TipoGerente.GERENTE) {
            // A SAGA redistribui as contas ANTES da remoção. Se falhar, propaga e a deleção
            // destrutiva abaixo não acontece (compensação por gating: aborta sem remover).
            try {
                Map<String, Object> body = new HashMap<>();
                body.put("gerenteCpf", cpf);
                httpPost(sagaUrl + "/saga/remover-gerente", objectMapper.writeValueAsString(body));
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Falha na saga de remoção de gerente: " + e.getMessage());
            }
        }

        gerenteRepository.delete(gerente);

        Map<String, String> authEvent = new HashMap<>();
        authEvent.put("acao", "remover");
        authEvent.put("cpf", cpf);

        try {
            rabbitTemplate.convertAndSend("auth.exchange", "auth.remover", authEvent);
        } catch (Exception e) {
            System.err.println("Aviso: não foi possível publicar evento no RabbitMQ: " + e.getMessage());
        }

        return toDTO(gerente);
    }
```

### ClienteService.java — alteração de perfil (R4) delegando à saga

```java
    public DadosClienteResponseDTO atualizarPerfil(String cpf, PerfilRequestDTO dto) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Cliente não encontrado"));

        if (dto.getEmail() != null && !dto.getEmail().equals(c.getEmail())) {
            if (repository.existsByEmail(normalizarEmail(dto.getEmail()))) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Email já cadastrado por outro cliente");
            }
        }

        boolean salarioAlterado = dto.getSalario() != null
            && !dto.getSalario().equals(c.getSalario());

        if (dto.getNome() != null)     c.setNome(normalizarTexto(dto.getNome()));
        if (dto.getEmail() != null)    c.setEmail(normalizarEmail(dto.getEmail()));
        if (dto.getSalario() != null)  c.setSalario(dto.getSalario());
        if (dto.getEndereco() != null) c.setEndereco(normalizarTexto(dto.getEndereco()));
        if (dto.getCep() != null)      c.setCep(normalizarDocumento(dto.getCep()));
        if (dto.getCidade() != null)   c.setCidade(normalizarTexto(dto.getCidade()));
        if (dto.getEstado() != null)   c.setEstado(normalizarUf(dto.getEstado()));

        repository.save(c);

        try {
            Map<String, String> authUpdate = new HashMap<>();
            authUpdate.put("cpf", cpf);
            if (dto.getNome() != null)  authUpdate.put("nome", normalizarTexto(dto.getNome()));
            if (dto.getEmail() != null) authUpdate.put("email", normalizarEmail(dto.getEmail()));
            rabbitTemplate.convertAndSend(RabbitMQConfig.AUTH_EXCHANGE, "auth.atualizar", authUpdate);
        } catch (Exception e) {
            System.err.println("cliente-service: aviso - não foi possível publicar evento auth.atualizar: "
                + e.getMessage());
        }

        // R4: se salário mudou, dispara a SAGA de alteração de perfil (orquestrada pelo
        // saga-service), que coordena o recálculo do limite no conta-service.
        if (salarioAlterado) {
            // Se a saga (recálculo de limite na conta) falhar, propaga para que o @Transactional
            // reverta a alteração dos dados do cliente já aplicada acima (compensação local).
            try {
                Map<String, Object> body = new HashMap<>();
                body.put("cpf", cpf);
                body.put("novoSalario", dto.getSalario());
                httpPost(sagaUrl + "/saga/alterar-perfil", objectMapper.writeValueAsString(body));
            } catch (Exception e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Falha na saga de alteração de perfil: " + e.getMessage());
            }
        }

        return toDadosClienteDTO(c);
```
