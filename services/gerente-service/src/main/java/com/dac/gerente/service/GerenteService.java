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

    @Value("${saga.services.saga}")
    private String sagaUrl;

    @Value("${saga.services.auth}")
    private String authUrl;

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<DadoGerente> listarTodos() {
        return gerenteRepository.findAllByOrderByNomeAsc()
                .stream()
                .filter(g -> g.getTipo() == TipoGerente.GERENTE)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public DadoGerente consultarPorCpf(String cpf) {
        Gerente gerente = gerenteRepository.findById(cpf)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Gerente não encontrado"));
        return toDTO(gerente);
    }

    public List<Map<String, Object>> dashboardGerentes() {
        List<DadoGerente> gerentes = listarTodos();

        // Busca saldos positivos e negativos agrupados por gerente
        Map<String, Double> saldoPos;
        Map<String, Double> saldoNeg;
        try {
            String posJson = httpGet(contaUrl + "/contas/saldo-positivo-por-gerente");
            saldoPos = objectMapper.readValue(posJson, new TypeReference<Map<String, Double>>() {});
        } catch (Exception e) {
            saldoPos = new HashMap<>();
        }
        try {
            String negJson = httpGet(contaUrl + "/contas/saldo-negativo-por-gerente");
            saldoNeg = objectMapper.readValue(negJson, new TypeReference<Map<String, Double>>() {});
        } catch (Exception e) {
            saldoNeg = new HashMap<>();
        }

        final Map<String, Double> finalSaldoPos = saldoPos;
        final Map<String, Double> finalSaldoNeg = saldoNeg;

        List<Map<String, Object>> dashboard = gerentes.stream().map(g -> {
            Map<String, Object> item = new HashMap<>();

            // "gerente" é um objeto aninhado com cpf, nome, email, tipo
            Map<String, String> gerenteObj = new HashMap<>();
            gerenteObj.put("cpf", g.getCpf());
            gerenteObj.put("nome", g.getNome());
            gerenteObj.put("email", g.getEmail());
            gerenteObj.put("tipo", g.getTipo());
            item.put("gerente", gerenteObj);

            // Busca lista de clientes (contas) desse gerente
            List<Map<String, Object>> clientes;
            try {
                String contasJson = httpGet(contaUrl + "/contas/por-gerente/" + g.getCpf());
                clientes = objectMapper.readValue(contasJson, new TypeReference<List<Map<String, Object>>>() {});
            } catch (Exception e) {
                clientes = List.of();
            }
            item.put("clientes", clientes);

            item.put("saldo_positivo", finalSaldoPos.getOrDefault(g.getCpf(), 0.0));
            item.put("saldo_negativo", finalSaldoNeg.getOrDefault(g.getCpf(), 0.0));

            return item;
        }).collect(Collectors.toList());

        // Ordena por saldo_positivo decrescente
        dashboard.sort((a, b) -> Double.compare(
                (Double) b.get("saldo_positivo"),
                (Double) a.get("saldo_positivo")));

        return dashboard;
    }

    public List<Map<String, Object>> buscarContasPorGerente(String cpf) {
        try {
            String json = httpGet(contaUrl + "/contas/por-gerente/" + cpf);
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro ao buscar contas do gerente: " + e.getMessage());
        }
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

        if (gerente.getTipo() == TipoGerente.GERENTE) {
            try {
                Map<String, Object> body = new HashMap<>();
                body.put("gerenteCpf", dto.getCpf());
                body.put("gerenteNome", dto.getNome());
                httpPost(sagaUrl + "/saga/inserir-gerente", objectMapper.writeValueAsString(body));
            } catch (Exception e) {
                System.err.println("Aviso: saga de inserção de gerente (R17) falhou: " + e.getMessage());
            }
        }

        Map<String, String> authEvent = new HashMap<>();
        authEvent.put("acao", "criar");
        authEvent.put("cpf", dto.getCpf());
        authEvent.put("nome", dto.getNome());
        authEvent.put("email", dto.getEmail());
        authEvent.put("senha", dto.getSenha());
        authEvent.put("tipo", tipoNormalizado);

        // Cria o usuário no auth de forma síncrona, garantindo login imediato após a inserção
        // (evita corrida). O auth é idempotente, então o evento assíncrono abaixo não duplica.
        try {
            httpPost(authUrl + "/interno/usuario", objectMapper.writeValueAsString(authEvent));
        } catch (Exception e) {
            System.err.println("Aviso: falha ao criar usuário no auth (síncrono): " + e.getMessage());
        }

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
                Map<String, Object> body = new HashMap<>();
                body.put("gerenteCpf", cpf);
                httpPost(sagaUrl + "/saga/remover-gerente", objectMapper.writeValueAsString(body));
            } catch (Exception e) {
                System.err.println("Aviso: saga de remoção de gerente (R18) falhou: " + e.getMessage());
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