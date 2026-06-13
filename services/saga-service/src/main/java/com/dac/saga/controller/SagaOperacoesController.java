package com.dac.saga.controller;

import com.dac.saga.service.AlteracaoPerfilSagaService;
import com.dac.saga.service.InsercaoGerenteSagaService;
import com.dac.saga.service.RemocaoGerenteSagaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// SagaOperacoesController | dispara as sagas orquestradas de alteração de perfil,
// inserção e remoção de gerente. Endpoints internos chamados serviço-a-serviço
// (cliente-service e gerente-service), nunca expostos pelo gateway.
@RestController
@RequestMapping("/saga")
public class SagaOperacoesController {

    private final AlteracaoPerfilSagaService alteracaoPerfilSaga;
    private final InsercaoGerenteSagaService insercaoGerenteSaga;
    private final RemocaoGerenteSagaService remocaoGerenteSaga;

    public SagaOperacoesController(AlteracaoPerfilSagaService alteracaoPerfilSaga,
                                   InsercaoGerenteSagaService insercaoGerenteSaga,
                                   RemocaoGerenteSagaService remocaoGerenteSaga) {
        this.alteracaoPerfilSaga = alteracaoPerfilSaga;
        this.insercaoGerenteSaga = insercaoGerenteSaga;
        this.remocaoGerenteSaga = remocaoGerenteSaga;
    }

    @PostMapping("/alterar-perfil")
    public ResponseEntity<?> alterarPerfil(@RequestBody Map<String, Object> body) {
        String cpf = (String) body.get("cpf");
        Double novoSalario = body.get("novoSalario") != null
            ? ((Number) body.get("novoSalario")).doubleValue() : null;
        alteracaoPerfilSaga.executar(cpf, novoSalario);
        return ResponseEntity.ok(Map.of("status", "perfil_atualizado"));
    }

    @PostMapping("/inserir-gerente")
    public ResponseEntity<?> inserirGerente(@RequestBody Map<String, Object> body) {
        String cpf = (String) body.get("gerenteCpf");
        String nome = (String) body.get("gerenteNome");
        insercaoGerenteSaga.executar(cpf, nome);
        return ResponseEntity.ok(Map.of("status", "gerente_inserido"));
    }

    @PostMapping("/remover-gerente")
    public ResponseEntity<?> removerGerente(@RequestBody Map<String, Object> body) {
        String cpf = (String) body.get("gerenteCpf");
        remocaoGerenteSaga.executar(cpf);
        return ResponseEntity.ok(Map.of("status", "gerente_removido"));
    }
}
