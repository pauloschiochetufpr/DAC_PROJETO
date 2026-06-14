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
