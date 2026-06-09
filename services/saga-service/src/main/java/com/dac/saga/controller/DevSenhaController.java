package com.dac.saga.controller;

import com.dac.saga.service.AutocadastroSagaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/saga")
public class DevSenhaController {

    private final AutocadastroSagaService service;

    public DevSenhaController(AutocadastroSagaService service) {
        this.service = service;
    }

    @GetMapping("/senha/{cpf}")
    public ResponseEntity<?> getSenha(@PathVariable String cpf) {
        String senha = service.getSenhaPorCpf(cpf);
        if (senha == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(Map.of("senha", senha));
    }
}
