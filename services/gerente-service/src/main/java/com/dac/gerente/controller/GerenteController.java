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
    public ResponseEntity<List<DadoGerente>> listar(
            @RequestParam(value = "filtro", required = false) String filtro) {
        List<DadoGerente> gerentes = gerenteService.listarTodos();
        return ResponseEntity.ok(gerentes);
    }

    @PostMapping
    public ResponseEntity<DadoGerente> cadastrar(@RequestBody GerenteInsercao request) {
        DadoGerente response = gerenteService.cadastrar(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{cpf}")
    public ResponseEntity<DadoGerente> consultar(@PathVariable String cpf) {
        DadoGerente response = gerenteService.consultarPorCpf(cpf);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{cpf}")
    public ResponseEntity<DadoGerente> atualizar(@PathVariable String cpf,
                                                  @RequestBody GerenteAtt request) {
        DadoGerente response = gerenteService.atualizar(cpf, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{cpf}")
    public ResponseEntity<DadoGerente> remover(@PathVariable String cpf) {
        DadoGerente response = gerenteService.remover(cpf);
        return ResponseEntity.ok(response);
    }
}