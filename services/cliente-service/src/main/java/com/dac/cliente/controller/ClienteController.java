package com.dac.cliente.controller;

import com.dac.cliente.dto.request.*;
import com.dac.cliente.dto.response.*;
import com.dac.cliente.service.ClienteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/clientes")
public class ClienteController {

    @Autowired
    private ClienteService service;

    @GetMapping
    public Object listar(@RequestParam(required = false) String filtro) {

        if ("para_aprovar".equals(filtro)) {
            return service.listarParaAprovar();
        }

        throw new RuntimeException("Filtro não suportado");
    }

    @PostMapping
    public void autocadastro(@RequestBody AutocadastroRequestDTO dto) {
        service.autocadastro(dto);
    }

    @GetMapping("/{cpf}")
    public DadosClienteResponseDTO buscar(@PathVariable String cpf) {
        return service.buscarDadosCompletos(cpf);
    }

    @PutMapping("/{cpf}")
    public void atualizar(@PathVariable String cpf,
                          @RequestBody PerfilRequestDTO dto) {
        service.atualizarPerfil(cpf, dto);
    }

    @PostMapping("/{cpf}/aprovar")
    public String aprovar(@PathVariable String cpf) {
        service.aprovar(cpf);
        return "Cliente aprovado";
    }

    @PostMapping("/{cpf}/rejeitar")
    public String rejeitar(@PathVariable String cpf,
                           @RequestBody RejeitarClienteRequestDTO dto) {
        service.rejeitar(cpf, dto.getMotivo());
        return "Cliente rejeitado";
    }
}