package com.dac.conta.controller;

import com.dac.conta.dto.request.DepositoRequestDTO;
import com.dac.conta.dto.request.SaqueRequestDTO;
import com.dac.conta.dto.request.TransferenciaRequestDTO;
import com.dac.conta.dto.response.ExtratoResponseDTO;
import com.dac.conta.dto.response.OperacaoResponseDTO;
import com.dac.conta.dto.response.SaldoResponseDTO;
import com.dac.conta.dto.response.TransferenciaResponseDTO;
import com.dac.conta.service.ContaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class ContaController {

    @Autowired
    private ContaService contaService;

    @GetMapping("/{numero}/saldo")
    public ResponseEntity<SaldoResponseDTO> saldo(@PathVariable String numero) {
        return ResponseEntity.ok(contaService.consultarSaldo(numero));
    }

    @PostMapping("/{numero}/depositar")
    public ResponseEntity<OperacaoResponseDTO> depositar(
            @PathVariable String numero,
            @RequestBody DepositoRequestDTO request) {
        return ResponseEntity.ok(contaService.depositar(numero, request));
    }

    @PostMapping("/{numero}/sacar")
    public ResponseEntity<OperacaoResponseDTO> sacar(
            @PathVariable String numero,
            @RequestBody SaqueRequestDTO request) {
        return ResponseEntity.ok(contaService.sacar(numero, request));
    }

    @PostMapping("/{numero}/transferir")
    public ResponseEntity<TransferenciaResponseDTO> transferir(
            @PathVariable String numero,
            @RequestBody TransferenciaRequestDTO request) {
        return ResponseEntity.ok(contaService.transferir(numero, request));
    }

    @GetMapping("/{numero}/extrato")
    public ResponseEntity<ExtratoResponseDTO> extrato(@PathVariable String numero) {
        return ResponseEntity.ok(contaService.consultarExtrato(numero));
    }
}