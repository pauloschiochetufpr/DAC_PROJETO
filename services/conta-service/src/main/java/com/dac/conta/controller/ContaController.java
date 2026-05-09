package com.dac.conta.controller;

import com.dac.conta.dto.request.AtualizarLimiteRequestDTO;
import com.dac.conta.dto.request.CriarContaRequestDTO;
import com.dac.conta.dto.request.DepositoRequestDTO;
import com.dac.conta.dto.request.RedistribuirRequestDTO;
import com.dac.conta.dto.request.SaqueRequestDTO;
import com.dac.conta.dto.request.TransferenciaRequestDTO;
import com.dac.conta.dto.response.ContaResponseDTO;
import com.dac.conta.dto.response.ExtratoResponseDTO;
import com.dac.conta.dto.response.OperacaoResponseDTO;
import com.dac.conta.dto.response.SaldoResponseDTO;
import com.dac.conta.dto.response.TransferenciaResponseDTO;
import com.dac.conta.service.ContaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
public class ContaController {

    @Autowired
    private ContaService contaService;

    // -------------------------
    // Operações de conta do cliente
    // -------------------------

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

    // GET /{numero}/extrato?dataInicio=2025-01-01&dataFim=2025-12-31
    @GetMapping("/{numero}/extrato")
    public ResponseEntity<ExtratoResponseDTO> extrato(
            @PathVariable String numero,
            @RequestParam(required = false) String dataInicio,
            @RequestParam(required = false) String dataFim) {
        LocalDateTime inicio = dataInicio != null
            ? LocalDate.parse(dataInicio).atStartOfDay() : null;
        LocalDateTime fim = dataFim != null
            ? LocalDate.parse(dataFim).atTime(23, 59, 59) : null;
        return ResponseEntity.ok(contaService.consultarExtrato(numero, inicio, fim));
    }

    // -------------------------
    // Consultas de conta
    // -------------------------

    @GetMapping("/por-cliente/{cpf}")
    public ResponseEntity<ContaResponseDTO> contaPorCliente(@PathVariable String cpf) {
        return ResponseEntity.ok(contaService.consultarContaPorCliente(cpf));
    }

    // -------------------------
    // Endpoints internos para o gerente-service (R17/R18)
    // -------------------------

    @GetMapping("/contagem-por-gerente")
    public ResponseEntity<Map<String, Long>> contagemPorGerente() {
        return ResponseEntity.ok(contaService.contagemPorGerente());
    }

    @GetMapping("/saldo-positivo-por-gerente")
    public ResponseEntity<Map<String, Double>> saldoPositivoPorGerente() {
        return ResponseEntity.ok(contaService.saldoPositivoPorGerente());
    }

    @PostMapping("/redistribuir")
    public ResponseEntity<Void> redistribuir(@RequestBody RedistribuirRequestDTO request) {
        contaService.redistribuir(request);
        return ResponseEntity.ok().build();
    }

    // -------------------------
    // Endpoint interno para o saga-service (R10)
    // -------------------------

    @PostMapping("/criar")
    public ResponseEntity<ContaResponseDTO> criarConta(@RequestBody CriarContaRequestDTO request) {
        return ResponseEntity.status(201).body(contaService.criarConta(request));
    }

    // -------------------------
    // Endpoint interno para atualização de limite (R4)
    // -------------------------

    @PutMapping("/limite")
    public ResponseEntity<Void> atualizarLimite(@RequestBody AtualizarLimiteRequestDTO request) {
        contaService.atualizarLimite(request);
        return ResponseEntity.ok().build();
    }
}