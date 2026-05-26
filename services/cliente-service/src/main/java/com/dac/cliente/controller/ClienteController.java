package com.dac.cliente.controller;

import com.dac.cliente.dto.request.AutocadastroRequestDTO;
import com.dac.cliente.dto.request.PerfilRequestDTO;
import com.dac.cliente.dto.request.RejeitarClienteRequestDTO;
import com.dac.cliente.dto.response.ClienteParaAprovarResponseDTO;
import com.dac.cliente.dto.response.ClienteResponseDTO;
import com.dac.cliente.dto.response.DadosClienteResponseDTO;
import com.dac.cliente.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    @Autowired
    private ClienteService service;

    @PostMapping
    public ResponseEntity<?> autocadastro(@RequestBody AutocadastroRequestDTO dto) {
        service.autocadastro(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(java.util.Map.of("cpf", dto.getCpf(), "email", dto.getEmail()));
    }

    @GetMapping
    public ResponseEntity<?> listar(
            @RequestParam(value = "filtro", required = false) String filtro) {

        if ("para_aprovar".equalsIgnoreCase(filtro)) {
            List<ClienteParaAprovarResponseDTO> pendentes = service.listarParaAprovar();
            return ResponseEntity.ok(pendentes);
        }

        if ("adm_relatorio_clientes".equalsIgnoreCase(filtro)) {
            List<DadosClienteResponseDTO> relatorio = service.listarParaRelatorio();
            return ResponseEntity.ok(relatorio);
        }

        if ("melhores_clientes".equalsIgnoreCase(filtro)) {
            List<ClienteResponseDTO> melhores = service.listarMelhoresClientes();
            return ResponseEntity.ok(melhores);
        }

        List<ClienteResponseDTO> todos = service.listarTodosAprovados();
        return ResponseEntity.ok(todos);
    }

    @GetMapping("/{cpf}")
    public ResponseEntity<DadosClienteResponseDTO> consultar(@PathVariable String cpf) {
        return ResponseEntity.ok(service.consultarPorCpf(cpf));
    }

    @PutMapping("/{cpf}")
    public ResponseEntity<DadosClienteResponseDTO> atualizarPerfil(
            @PathVariable String cpf,
            @RequestBody PerfilRequestDTO dto) {
        return ResponseEntity.ok(service.atualizarPerfil(cpf, dto));
    }

    @PostMapping("/{cpf}/aprovar")
    public ResponseEntity<?> aprovar(@PathVariable String cpf) {
        service.aprovarCliente(cpf);
        return ResponseEntity.ok("Cliente aprovado com sucesso.");
    }

    @PostMapping("/{cpf}/rejeitar")
    public ResponseEntity<?> rejeitar(
            @PathVariable String cpf,
            @RequestBody RejeitarClienteRequestDTO dto) {
        service.rejeitarCliente(cpf, dto.getMotivo());
        return ResponseEntity.ok("Cliente rejeitado com sucesso.");
    }
}