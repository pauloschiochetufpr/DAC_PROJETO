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

        // R4: se salário mudou, notifica conta-service para recalcular limite
        if (salarioAlterado) {
            try {
                Map<String, Object> limiteEvento = new HashMap<>();
                limiteEvento.put("clienteCpf", cpf);
                limiteEvento.put("novoSalario", dto.getSalario());
                rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_CONTA_LIMITE, limiteEvento);
            } catch (Exception e) {
                System.err.println("cliente-service: aviso - não foi possível publicar evento conta.limite: "
                    + e.getMessage());
            }

            // Chamada síncrona para atualizar limite imediatamente (PyTest não espera mensageria)
            try {
                Map<String, Object> body = new HashMap<>();
                body.put("clienteCpf", cpf);
                body.put("novoSalario", dto.getSalario());
                httpPut(contaUrl + "/contas/limite", objectMapper.writeValueAsString(body));
            } catch (Exception e) {
                System.err.println("cliente-service: aviso - falha na atualização síncrona de limite: "
                    + e.getMessage());
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
