package com.dac.saga.controller;

import com.dac.saga.service.AutocadastroSagaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// DevSenhaController | endpoint de desenvolvimento/teste que devolve a senha temporária
// gerada na aprovação de um cliente, indexada por CPF. Usado pelo test_dac (o conftest
// consulta GET /saga/senha/{cpf}) para conseguir fazer o primeiro login do cliente aprovado.
@RestController
public class DevSenhaController {

    private final AutocadastroSagaService autocadastroSagaService;

    public DevSenhaController(AutocadastroSagaService autocadastroSagaService) {
        this.autocadastroSagaService = autocadastroSagaService;
    }

    @GetMapping("/saga/senha/{cpf}")
    public ResponseEntity<Map<String, String>> obterSenha(@PathVariable String cpf) {
        String senha = autocadastroSagaService.getSenhaPorCpf(cpf);
        if (senha == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("senha", senha));
    }
}
