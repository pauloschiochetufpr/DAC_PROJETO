package com.dac.saga.service;

import com.dac.saga.config.RabbitMQConfig;
import com.dac.saga.util.SagaCompensacao;
import com.dac.saga.util.SagaHttp;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
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
// Etapas coordenadas pelo orquestrador:
//   1. MS Gerente: inserção do gerente (executada pelo gerente-service, que dispara esta saga
//      e faz rollback transacional local caso a saga falhe)
//   2. MS Auth: criação do usuário de autenticação do gerente (compensação: remover usuário)
//   3. MS Conta: consultar gerente com mais contas e atribuir 1 conta ao novo gerente
@Service
public class InsercaoGerenteSagaService {

    @Value("${saga.services.conta}")
    private String contaUrl;

    @Value("${saga.services.auth}")
    private String authUrl;

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public InsercaoGerenteSagaService(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void executar(String cpf, String nome, String email, String senha, String tipo) {
        if (cpf == null || cpf.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CPF do novo gerente obrigatório");
        }

        String tipoNorm = tipo == null ? "gerente" : tipo.trim().toLowerCase();
        publicarEvento("insercao_gerente.iniciada", cpf);

        SagaCompensacao compensacao = new SagaCompensacao();
        try {
            // Etapa MS Auth: cria o usuário de autenticação (síncrono). Compensação: removê-lo.
            criarUsuarioNoAuth(cpf, nome, email, senha, tipoNorm);
            compensacao.registrar("remover usuário auth do gerente " + cpf, () -> removerUsuarioNoAuth(cpf));
            publicarUsuarioNoAuth(cpf, nome, email, senha, tipoNorm);

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

    private void redistribuirContaParaNovoGerente(String novoGerenteCpf, String novoGerenteNome) throws Exception {
        String contagemJson = SagaHttp.get(contaUrl + "/contas/contagem-por-gerente");
        Map<String, Long> contagem = objectMapper.readValue(
            contagemJson, new TypeReference<Map<String, Long>>() {});

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

        Map<String, Object> body = new HashMap<>();
        body.put("gerenteOrigemCpf", gerenteOrigem);
        body.put("gerenteDestinoCpf", novoGerenteCpf);
        body.put("gerenteDestinoNome", novoGerenteNome);
        body.put("quantidade", 1);
        SagaHttp.post(contaUrl + "/contas/redistribuir", objectMapper.writeValueAsString(body));

        System.out.println("Saga inserção de gerente: 1 conta redistribuída de "
            + gerenteOrigem + " para " + novoGerenteCpf);
    }

    private void criarUsuarioNoAuth(String cpf, String nome, String email, String senha, String tipo) {
        try {
            Map<String, String> body = new HashMap<>();
            body.put("cpf", cpf);
            body.put("nome", nome);
            body.put("email", email != null ? email.toLowerCase(Locale.ROOT) : null);
            body.put("senha", senha);
            body.put("tipo", tipo);
            SagaHttp.post(authUrl + "/interno/usuario", objectMapper.writeValueAsString(body));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                "Falha ao criar usuário do gerente no auth: " + e.getMessage(), e);
        }
    }

    private void removerUsuarioNoAuth(String cpf) {
        try {
            SagaHttp.delete(authUrl + "/interno/usuario/" + cpf);
        } catch (Exception e) {
            throw new RuntimeException("Falha ao remover usuário auth na compensação: " + e.getMessage(), e);
        }
    }

    private void publicarUsuarioNoAuth(String cpf, String nome, String email, String senha, String tipo) {
        try {
            Map<String, String> evento = new HashMap<>();
            evento.put("acao", "criar");
            evento.put("cpf", cpf);
            evento.put("nome", nome);
            evento.put("email", email != null ? email.toLowerCase(Locale.ROOT) : null);
            evento.put("senha", senha);
            evento.put("tipo", tipo);
            rabbitTemplate.convertAndSend("auth.exchange", "auth.criar", evento);
        } catch (Exception ignored) {
            // publicação assíncrona é best-effort; a criação síncrona já garantiu o usuário
        }
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
