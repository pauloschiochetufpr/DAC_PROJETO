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
}