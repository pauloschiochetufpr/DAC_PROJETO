package com.dac.saga.controller;

import com.dac.saga.service.AutocadastroSagaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/saga")
public class SagaAprovacaoController {

    private final AutocadastroSagaService autocadastroSagaService;

    public SagaAprovacaoController(AutocadastroSagaService autocadastroSagaService) {
        this.autocadastroSagaService = autocadastroSagaService;
    }

    @PostMapping("/aprovar")
    public ResponseEntity<?> aprovarSincrono(@RequestBody Map<String, Object> evento) {
        autocadastroSagaService.processarAprovacao(evento);
        return ResponseEntity.ok(Map.of("status", "aprovado"));
    }
}
