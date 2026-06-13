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
