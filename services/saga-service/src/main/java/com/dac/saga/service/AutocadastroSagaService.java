package com.dac.saga.service;

import com.dac.saga.config.RabbitMQConfig;
import com.dac.saga.email.EmailPayload;
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
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.security.SecureRandom;

@Service
public class AutocadastroSagaService {

    @Value("${saga.services.cliente}")
    private String clienteUrl;

    @Value("${saga.services.gerente}")
    private String gerenteUrl;

    @Value("${saga.services.conta}")
    private String contaUrl;

    private final RabbitTemplate rabbitTemplate;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AutocadastroSagaService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void processarAprovacao(Map<String, Object> evento) {
        String cpf = validarCpf(evento, "cpf", "aprovacao");
        String nome = validarTexto(evento, "nome", "aprovacao");
        String email = validarEmail(evento, "email", "aprovacao");
        Double salario = paraDouble(evento.get("salario"), null);
        Double limite = validarLimite(evento);
        String dataAprovacao = texto((String) evento.get("dataAprovacao"));

        String numeroConta = null;
        boolean authPublicado = false;

        try {
            System.out.println("Saga aprovacao: iniciando fluxo para cliente " + cpf
                + " com limite " + limite
                + (salario != null ? " e salario " + salario : "")
                + (dataAprovacao != null ? " em " + dataAprovacao : ""));

            Map<String, Object> gerente = selecionarGerenteComMenosClientes();
            String gerenteCpf = validarCpf(gerente, "cpf", "selecao de gerente");
            String gerenteNome = validarTexto(gerente, "nome", "selecao de gerente");

            System.out.println("Saga aprovacao: gerente selecionado = " + gerenteCpf + " (" + gerenteNome + ")");

            Map<String, Object> contaCriada = criarConta(cpf, nome, gerenteCpf, gerenteNome, limite);
            numeroConta = texto(contaCriada.get("numero") != null ? contaCriada.get("numero").toString() : null);

            System.out.println("Saga aprovacao: conta criada para cliente " + cpf
                + (numeroConta != null ? " numero " + numeroConta : ""));

            String senhaTemporaria = gerarSenha();
            System.out.println("Saga aprovacao: senha temporaria gerada para cliente " + cpf);

            publicarUsuarioNoAuth(cpf, nome, email, senhaTemporaria);
            authPublicado = true;
            System.out.println("Saga aprovacao: evento auth.criar publicado para cliente " + cpf);

            publicarEmailAprovacao(email, nome, cpf, numeroConta, senhaTemporaria, gerenteNome);
            System.out.println("Saga aprovacao: evento de email publicado para cliente " + cpf);
        } catch (Exception e) {
            System.err.println("Saga aprovacao: erro no fluxo do cliente " + cpf + ": " + e.getMessage());
            compensarFalhaAprovacao(cpf, email, nome, numeroConta, authPublicado, e.getMessage());
            throw e;
        }
    }

    public void processarRejeicao(Map<String, Object> evento) {
        String cpf = validarCpf(evento, "cpf", "rejeicao");
        String nome = validarTexto(evento, "nome", "rejeicao");
        String email = validarEmail(evento, "email", "rejeicao");
        String motivo = validarTexto(evento, "motivo", "rejeicao");

        System.out.println("Saga rejeicao: cliente " + cpf + " rejeitado. Publicando email.");
        publicarEmailRejeicao(email, nome, cpf, motivo);
    }

    private void compensarFalhaAprovacao(String cpf, String email, String nome, String numeroConta,
                                         boolean authPublicado, String motivoErro) {
        System.err.println("Saga compensacao: iniciando rollback do cliente " + cpf);

        if (numeroConta != null) {
            try {
                removerContaPorCliente(cpf);
                System.err.println("Saga compensacao: conta removida para cliente " + cpf);
            } catch (Exception contaError) {
                System.err.println("Saga compensacao: falha ao remover conta do cliente "
                    + cpf + ": " + contaError.getMessage());
            }
        }

        if (authPublicado) {
            try {
                publicarRemocaoAuth(cpf);
                System.err.println("Saga compensacao: evento auth.remover publicado para cliente " + cpf);
            } catch (Exception authError) {
                System.err.println("Saga compensacao: falha ao publicar auth.remover para cliente "
                    + cpf + ": " + authError.getMessage());
            }
        }

        try {
            reverterClienteParaPendente(cpf);
            System.err.println("Saga compensacao: cliente revertido para PENDENTE " + cpf);
        } catch (Exception clienteError) {
            System.err.println("Saga compensacao: falha ao reverter cliente "
                + cpf + " para PENDENTE: " + clienteError.getMessage());
        }

        publicarEmailFalha(email, nome, cpf, "Falha interna ao concluir abertura da conta: " + motivoErro);
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
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Nenhum gerente disponivel para aprovacao");
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

    private Map<String, Object> criarConta(String clienteCpf, String clienteNome, String gerenteCpf, String gerenteNome, Double limite) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("clienteCpf", clienteCpf);
            body.put("clienteNome", clienteNome);
            body.put("gerenteCpf", gerenteCpf);
            body.put("gerenteNome", gerenteNome);
            body.put("limite", limite != null && limite >= 0 ? limite : 0.0);

            String response = httpPost(contaUrl + "/contas/criar", objectMapper.writeValueAsString(body));
            return objectMapper.readValue(response, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro ao criar conta: " + e.getMessage(), e);
        }
    }

    private void removerContaPorCliente(String clienteCpf) throws Exception {
        httpDelete(contaUrl + "/contas/por-cliente/" + clienteCpf);
    }

    private void reverterClienteParaPendente(String cpf) throws Exception {
        httpPost(clienteUrl + "/clientes/" + cpf + "/compensar-aprovacao", "");
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

    private void publicarRemocaoAuth(String cpf) {
        Map<String, String> authEvento = new HashMap<>();
        authEvento.put("acao", "remover");
        authEvento.put("cpf", cpf);
        rabbitTemplate.convertAndSend("auth.exchange", "auth.remover", authEvento);
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

    private void publicarEmailFalha(String destinatario, String nome, String cpf, String motivo) {
        try {
            EmailPayload payload = new EmailPayload();
            payload.setTipo("FALHA_AUTOCADASTRO");
            payload.setDestinatario(destinatario);
            payload.setNome(nome);
            payload.setCpf(cpf);
            payload.setMotivo(motivo);
            rabbitTemplate.convertAndSend(RabbitMQConfig.FILA_EMAIL_SEND, payload);
        } catch (Exception publishError) {
            System.err.println("Saga aprovacao: falha ao publicar email de erro para cliente "
                + cpf + ": " + publishError.getMessage());
        }
    }

    private String validarCpf(Map<String, ?> origem, String campo, String contexto) {
        String cpf = normalizarDocumento((String) origem.get(campo));
        if (cpf == null || cpf.length() != 11) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF invalido para " + contexto);
        }
        return cpf;
    }

    private String validarTexto(Map<String, ?> origem, String campo, String contexto) {
        String valor = texto((String) origem.get(campo));
        if (valor == null || valor.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, campo + " obrigatorio para " + contexto);
        }
        return valor;
    }

    private String validarEmail(Map<String, ?> origem, String campo, String contexto) {
        String email = validarTexto(origem, campo, contexto).toLowerCase(Locale.ROOT);
        if (!email.contains("@") || email.startsWith("@") || email.endsWith("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email invalido para " + contexto);
        }
        return email;
    }

    private Double validarLimite(Map<String, Object> evento) {
        Double limite = paraDouble(evento.get("limite"), 0.0);
        if (limite == null || limite < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Limite invalido para aprovacao");
        }
        return limite;
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
        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json");

        HttpRequest request = builder.POST(HttpRequest.BodyPublishers.ofString(jsonBody == null ? "" : jsonBody)).build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("HTTP " + response.statusCode() + ": " + response.body());
        }
        return response.body();
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
