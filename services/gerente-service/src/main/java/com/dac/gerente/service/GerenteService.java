package com.dac.gerente.service;

import com.dac.gerente.dto.request.GerenteAtt;
import com.dac.gerente.dto.request.GerenteInsercao;
import com.dac.gerente.dto.response.DadoGerente;
import com.dac.gerente.entity.Gerente;
import com.dac.gerente.entity.TipoGerente;
import com.dac.gerente.repository.GerenteRepository;
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
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class GerenteService {

    @Autowired
    private GerenteRepository gerenteRepository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Value("${saga.services.conta}")
    private String contaUrl;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<DadoGerente> listarTodos() {
        return gerenteRepository.findAllByOrderByNomeAsc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public DadoGerente consultarPorCpf(String cpf) {
        Gerente gerente = gerenteRepository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gerente não encontrado"));
        return toDTO(gerente);
    }

    @Transactional
    public DadoGerente atualizar(String cpf, GerenteAtt dto) {
        Gerente gerente = gerenteRepository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gerente não encontrado"));

        if (dto.getNome() != null) {
            gerente.setNome(dto.getNome());
        }
        if (dto.getEmail() != null) {
            if (gerenteRepository.existsByEmailAndCpfNot(dto.getEmail(), cpf)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado por outro gerente");
            }
            gerente.setEmail(dto.getEmail());
        }
        if (dto.getTelefone() != null) {
            gerente.setTelefone(dto.getTelefone());
        }

        gerenteRepository.save(gerente);

        Map<String, String> authEvent = new HashMap<>();
        authEvent.put("acao", "atualizar");
        authEvent.put("cpf", cpf);
        if (dto.getNome() != null)  authEvent.put("nome", dto.getNome());
        if (dto.getEmail() != null) authEvent.put("email", dto.getEmail());
        if (dto.getSenha() != null) authEvent.put("senha", dto.getSenha());

        try {
            rabbitTemplate.convertAndSend("auth.exchange", "auth.atualizar", authEvent);
        } catch (Exception e) {
            System.err.println("Aviso: não foi possível publicar evento no RabbitMQ: " + e.getMessage());
        }

        return toDTO(gerente);
    }

    @Transactional
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

        if ("gerente".equalsIgnoreCase(dto.getTipo())) {
            gerente.setTipo(TipoGerente.GERENTE);
        } else if ("administrador".equalsIgnoreCase(dto.getTipo())) {
            gerente.setTipo(TipoGerente.ADMINISTRADOR);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tipo inválido: use 'gerente' ou 'administrador'");
        }

        gerenteRepository.save(gerente);

        if (gerente.getTipo() == TipoGerente.GERENTE) {
            try {
                redistribuirParaNovoGerente(dto.getCpf(), dto.getNome());
            } catch (Exception e) {
                System.err.println("Aviso: redistribuição R17 falhou: " + e.getMessage());
            }
        }

        Map<String, String> authEvent = new HashMap<>();
        authEvent.put("acao", "criar");
        authEvent.put("cpf", dto.getCpf());
        authEvent.put("nome", dto.getNome());
        authEvent.put("email", dto.getEmail());
        authEvent.put("senha", dto.getSenha());
        authEvent.put("tipo", dto.getTipo().toLowerCase());

        try {
            rabbitTemplate.convertAndSend("auth.exchange", "auth.criar", authEvent);
        } catch (Exception e) {
            System.err.println("Aviso: não foi possível publicar evento no RabbitMQ: " + e.getMessage());
        }

        return toDTO(gerente);
    }

    @Transactional
    public DadoGerente remover(String cpf) {
        Gerente gerente = gerenteRepository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gerente não encontrado"));

        long totalGerentes = gerenteRepository.countByTipo(TipoGerente.GERENTE);
        if (totalGerentes <= 1 && gerente.getTipo() == TipoGerente.GERENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Não é permitido remover o último gerente do banco");
        }

        if (gerente.getTipo() == TipoGerente.GERENTE) {
            try {
                redistribuirContasDoGerente(cpf);
            } catch (Exception e) {
                System.err.println("Aviso: redistribuição R18 falhou: " + e.getMessage());
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

    private void redistribuirParaNovoGerente(String novoGerenteCpf, String novoGerenteNome) throws Exception {
        String contagemJson = httpGet(contaUrl + "/contas/contagem-por-gerente");
        Map<String, Long> contagem = objectMapper.readValue(
                contagemJson, new TypeReference<Map<String, Long>>() {});

        if (contagem.isEmpty()) return;

        long maxContas = contagem.values().stream().mapToLong(Long::longValue).max().orElse(0);

        if (maxContas <= 1 && contagem.size() == 1) return;

        List<String> candidatos = contagem.entrySet().stream()
                .filter(e -> e.getValue() == maxContas)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        String gerenteOrigem;

        if (candidatos.size() == 1) {
            gerenteOrigem = candidatos.get(0);
        } else {
            String saldosJson = httpGet(contaUrl + "/contas/saldo-positivo-por-gerente");
            Map<String, Double> saldos = objectMapper.readValue(
                    saldosJson, new TypeReference<Map<String, Double>>() {});

            gerenteOrigem = candidatos.stream()
                    .min(Comparator.comparingDouble(c -> saldos.getOrDefault(c, 0.0)))
                    .orElse(candidatos.get(0));
        }

        String body = String.format(
                "{\"gerenteOrigemCpf\":\"%s\",\"gerenteDestinoCpf\":\"%s\",\"gerenteDestinoNome\":\"%s\",\"quantidade\":1}",
                gerenteOrigem, novoGerenteCpf, novoGerenteNome);

        httpPost(contaUrl + "/contas/redistribuir", body);
        System.out.println("R17: 1 conta redistribuída de " + gerenteOrigem + " para " + novoGerenteCpf);
    }

    private void redistribuirContasDoGerente(String gerenteRemovidoCpf) throws Exception {
        String contagemJson = httpGet(contaUrl + "/contas/contagem-por-gerente");
        Map<String, Long> contagem = objectMapper.readValue(
                contagemJson, new TypeReference<Map<String, Long>>() {});

        contagem.remove(gerenteRemovidoCpf);

        if (contagem.isEmpty()) return;

        String gerenteDestinoCpf = contagem.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Nenhum gerente disponível para redistribuição"));

        Gerente gerenteDestino = gerenteRepository.findById(gerenteDestinoCpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gerente destino não encontrado: " + gerenteDestinoCpf));

        String body = String.format(
                "{\"gerenteOrigemCpf\":\"%s\",\"gerenteDestinoCpf\":\"%s\",\"gerenteDestinoNome\":\"%s\",\"quantidade\":-1}",
                gerenteRemovidoCpf, gerenteDestinoCpf, gerenteDestino.getNome());

        httpPost(contaUrl + "/contas/redistribuir", body);
        System.out.println("R18: todas as contas de " + gerenteRemovidoCpf + " redistribuídas para " + gerenteDestinoCpf);
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

    private DadoGerente toDTO(Gerente gerente) {
        return new DadoGerente(
                gerente.getCpf(),
                gerente.getNome(),
                gerente.getEmail(),
                gerente.getTelefone(),
                gerente.getTipo() != null ? gerente.getTipo().name() : null
        );
    }
}