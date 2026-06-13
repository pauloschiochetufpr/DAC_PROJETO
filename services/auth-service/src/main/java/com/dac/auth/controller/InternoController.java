package com.dac.auth.controller;

// service
import com.dac.auth.service.UsuarioService;
// Spring
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

// InternoController | endpoints internos chamados serviço-a-serviço pela rede do Docker
// (nunca expostos pelo gateway). Usado pela SAGA de autocadastro para criar o usuário de
// forma síncrona, garantindo que ele exista antes de a aprovação retornar.
@RestController
@RequestMapping("/interno")
public class InternoController {

    private final UsuarioService usuarioService;

    public InternoController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    // criarUsuario | cria o usuário de forma idempotente e síncrona
    @PostMapping("/usuario")
    public ResponseEntity<Map<String, String>> criarUsuario(@RequestBody Map<String, String> msg) {
        boolean criado = usuarioService.criarUsuario(
            msg.get("cpf"),
            msg.get("nome"),
            msg.get("email"),
            msg.get("senha"),
            msg.get("tipo")
        );
        return ResponseEntity.ok(Map.of(
            "status", criado ? "criado" : "ja_existia",
            "cpf", msg.getOrDefault("cpf", "")
        ));
    }

    // removerUsuario | ação compensatória das sagas (rollback de criação de usuário)
    @DeleteMapping("/usuario/{cpf}")
    public ResponseEntity<Map<String, String>> removerUsuario(@PathVariable String cpf) {
        boolean removido = usuarioService.removerUsuario(cpf);
        return ResponseEntity.ok(Map.of(
            "status", removido ? "removido" : "nao_encontrado",
            "cpf", cpf
        ));
    }
}
