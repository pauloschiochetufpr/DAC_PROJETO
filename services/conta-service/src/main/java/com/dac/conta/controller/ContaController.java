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
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/contas")
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

    @GetMapping("/por-cliente/{cpf}")
    public ResponseEntity<ContaResponseDTO> contaPorCliente(@PathVariable String cpf) {
        return ResponseEntity.ok(contaService.consultarContaPorCliente(cpf));
    }

    @GetMapping("/por-gerente/{cpf}")
    public ResponseEntity<List<ContaResponseDTO>> contasPorGerente(@PathVariable String cpf) {
        return ResponseEntity.ok(contaService.consultarContasPorGerente(cpf));
    }

    @GetMapping("/contagem-por-gerente")
    public ResponseEntity<Map<String, Long>> contagemPorGerente() {
        return ResponseEntity.ok(contaService.contagemPorGerente());
    }

    @GetMapping("/saldo-positivo-por-gerente")
    public ResponseEntity<Map<String, Double>> saldoPositivoPorGerente() {
        return ResponseEntity.ok(contaService.saldoPositivoPorGerente());
    }

    @GetMapping("/saldo-negativo-por-gerente")
    public ResponseEntity<Map<String, Double>> saldoNegativoPorGerente() {
        return ResponseEntity.ok(contaService.saldoNegativoPorGerente());
    }

    @PostMapping("/redistribuir")
    public ResponseEntity<Void> redistribuir(@RequestBody RedistribuirRequestDTO request) {
        contaService.redistribuir(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/criar")
    public ResponseEntity<ContaResponseDTO> criarConta(@RequestBody CriarContaRequestDTO request) {
        return ResponseEntity.status(201).body(contaService.criarConta(request));
    }

    @DeleteMapping("/por-cliente/{cpf}")
    public ResponseEntity<Void> removerContaPorCliente(@PathVariable String cpf) {
        contaService.removerContaPorCliente(cpf);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/limite")
    public ResponseEntity<Void> atualizarLimite(@RequestBody AtualizarLimiteRequestDTO request) {
        contaService.atualizarLimite(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/remover")
    public ResponseEntity<Void> remover(@RequestBody Map<String, String> body) {
        contaService.removerContaPorCliente(body.get("clienteCpf"));
        return ResponseEntity.ok().build();
    }
}
