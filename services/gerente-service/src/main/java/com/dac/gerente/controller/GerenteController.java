package com.dac.gerente.controller;

import com.dac.gerente.dto.request.GerenteAtt;
import com.dac.gerente.dto.request.GerenteInsercao;
import com.dac.gerente.dto.response.DadoGerente;
import com.dac.gerente.service.GerenteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/gerentes")
public class GerenteController {

    @Autowired
    private GerenteService gerenteService;

    @GetMapping
    public ResponseEntity<?> listar(
            @RequestParam(value = "filtro", required = false) String filtro) {

        if ("dashboard".equalsIgnoreCase(filtro)) {
            // precisa dos dados do conta-service
            List<DadoGerente> gerentes = gerenteService.listarTodos();
            return ResponseEntity.ok(gerentes);
        }

        List<DadoGerente> gerentes = gerenteService.listarTodos();
        return ResponseEntity.ok(gerentes);
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody GerenteInsercao request) {
        try {
            DadoGerente response = gerenteService.cadastrar(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{cpf}")
    public ResponseEntity<?> consultar(@PathVariable String cpf) {
        try {
            DadoGerente response = gerenteService.consultarPorCpf(cpf);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{cpf}")
    public ResponseEntity<?> atualizar(@PathVariable String cpf,
                                       @RequestBody GerenteAtt request) {
        try {
            DadoGerente response = gerenteService.atualizar(cpf, request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("não encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{cpf}")
    public ResponseEntity<?> remover(@PathVariable String cpf) {
        try {
            DadoGerente response = gerenteService.remover(cpf);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("não encontrado")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}