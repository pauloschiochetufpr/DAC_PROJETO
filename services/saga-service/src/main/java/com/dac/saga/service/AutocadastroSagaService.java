package com.dac.saga.service;

import com.dac.saga.bus.SagaCommandBus;
import com.dac.saga.config.RabbitMQConfig;
import com.dac.saga.email.EmailPayload;
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

    private final RabbitTemplate rabbitTemplate;
    private final SagaCommandBus commandBus;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    // Guarda a senha gerada na aprovação, indexada por CPF. Usado pelo endpoint de dev
    // GET /saga/senha/{cpf} que o teste (test_dac) consulta para fazer o primeiro login.
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
        senhasPorCpf.put(cpf, senhaTemporaria);   // disponibiliza a senha para o GET /saga/senha/{cpf}
        SagaCompensacao compensacao = new SagaCompensacao();
        String numeroConta = null;

        try {
            numeroConta = criarConta(cpf, nome, gerenteCpf, gerenteNome, limite);
            compensacao.registrar("remover conta do cliente " + cpf, () -> removerContaNoConta(cpf));

            criarUsuarioNoAuthSincrono(cpf, nome, email, senhaTemporaria);
            compensacao.registrar("remover usuário auth do cliente " + cpf, () -> removerUsuarioNoAuth(cpf));
        } catch (RuntimeException e) {
            System.err.println("Saga autocadastro: falha - executando compensação. Causa: " + e.getMessage());
            compensacao.compensar();
            publicarEventoSaga("autocadastro.falha", cpf);
            throw e;
        }

        // Email é best-effort: fica FORA do try de compensação. Se falhar, NÃO derruba a aprovação
        // (conta e usuário já foram criados com sucesso).
        try {
            publicarEmailAprovacao(email, nome, cpf, numeroConta, senhaTemporaria, gerenteNome);
        } catch (Exception e) {
            System.err.println("Saga autocadastro: falha ao publicar email (ignorada): " + e.getMessage());
        }

        System.out.println("Saga aprovação: conta criada e senha enviada para " + email + " - Senha: " + senhaTemporaria);
    }

    public void processarRejeicao(Map<String, Object> evento) {
        String cpf = normalizarDocumento((String) evento.get("cpf"));
        String nome = texto((String) evento.get("nome"));
        String email = texto((String) evento.get("email"));
        String motivo = texto((String) evento.get("motivo"));

        if (cpf == null || cpf.length() != 11) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF inválido para rejeição");
        }
        if (nome == null || nome.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nome obrigatório para rejeição");
        }
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email obrigatório para rejeição");
        }
        if (motivo == null || motivo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Motivo obrigatório para rejeição");
        }

        publicarEmailRejeicao(email, nome, cpf, motivo);
        System.out.println("Saga rejeição: email publicado para " + email);
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

    private String criarConta(String clienteCpf, String clienteNome, String gerenteCpf, String gerenteNome, Double limite) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("clienteCpf", clienteCpf);
        payload.put("clienteNome", clienteNome);
        payload.put("gerenteCpf", gerenteCpf);
        payload.put("gerenteNome", gerenteNome);
        payload.put("limite", limite != null && limite >= 0 ? limite : 0.0);
        Map<String, Object> dados = commandBus.enviarEAguardar("comando.conta.criar", "criar_conta", payload).getDados();
        Object numero = dados != null ? dados.get("numero") : null;
        return numero == null ? null : numero.toString();
    }

    private void criarUsuarioNoAuthSincrono(String cpf, String nome, String email, String senhaTemporaria) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("cpf", cpf);
        payload.put("nome", nome);
        payload.put("email", email.toLowerCase(Locale.ROOT));
        payload.put("senha", senhaTemporaria);
        payload.put("tipo", "cliente");
        commandBus.enviarEAguardar("comando.auth.criar", "criar_usuario", payload);
    }

    private void removerContaNoConta(String cpf) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("clienteCpf", cpf);
        commandBus.enviarEAguardar("comando.conta.remover", "remover_conta", payload);
    }

    private void removerUsuarioNoAuth(String cpf) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("cpf", cpf);
        commandBus.enviarEAguardar("comando.auth.remover", "remover_usuario", payload);
    }

    private void publicarEmailAprovacao(String destinatario, String nome, String cpf, String numeroConta,
                                        String senhaTemporaria, String gerenteNome) {
        EmailPayload payload = new EmailPayload();
        payload.setTipo("APROVACAO_CLIENTE");
        payload.setDestinatario(destinatario);
        payload.setNome(nome);
        payload.setCpf(cpf);
        payload.setNumeroConta(numeroConta);
        payload.setSenhaTemporaria(senhaTemporaria);
        payload.setGerenteNome(gerenteNome);
        rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_EMAIL_SEND, payload);
    }

    private void publicarEmailRejeicao(String destinatario, String nome, String cpf, String motivo) {
        EmailPayload payload = new EmailPayload();
        payload.setTipo("REJEICAO_CLIENTE");
        payload.setDestinatario(destinatario);
        payload.setNome(nome);
        payload.setCpf(cpf);
        payload.setMotivo(motivo);
        rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_EMAIL_SEND, payload);
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
