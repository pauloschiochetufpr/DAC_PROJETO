/*package com.dac.gerente.controller;

import com.dac.gerente.dto.request.GerenteInsercao;
import com.dac.gerente.dto.response.DadoGerente;
import com.dac.gerente.service.GerenteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/gerentes")
public class GerenteController {
    
    @Autowired
    private GerenteService gerenteService;

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody GerenteInsercao request) {
        try {
            DadoGerente response = gerenteService.cadastrar(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}

*/