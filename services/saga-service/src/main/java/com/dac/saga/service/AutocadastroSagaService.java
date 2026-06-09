package com.dac.saga.service;

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

    private final RabbitTemplate rabbitTemplate;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, String> senhasPorCpf = new ConcurrentHashMap<>();

    public String getSenhaPorCpf(String cpf) {
        return senhasPorCpf.get(cpf);
    }

    public AutocadastroSagaService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
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

        criarConta(cpf, nome, gerenteCpf, gerenteNome, limite);

        String senhaTemporaria = gerarSenha();
        senhasPorCpf.put(cpf, senhaTemporaria);
        publicarUsuarioNoAuth(cpf, nome, email, senhaTemporaria);

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

    private void criarConta(String clienteCpf, String clienteNome, String gerenteCpf, String gerenteNome, Double limite) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("clienteCpf", clienteCpf);
            body.put("clienteNome", clienteNome);
            body.put("gerenteCpf", gerenteCpf);
            body.put("gerenteNome", gerenteNome);
            body.put("limite", limite != null && limite >= 0 ? limite : 0.0);

            httpPost(contaUrl + "/contas/criar", objectMapper.writeValueAsString(body));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro ao criar conta: " + e.getMessage(), e);
        }
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
}