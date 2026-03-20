package com.dac.conta.service;

import com.dac.conta.entity.ContaCUD;
import com.dac.conta.entity.ContaR;
import com.dac.conta.entity.MovimentacaoCUD;
import com.dac.conta.entity.MovimentacaoR;
import com.dac.conta.entity.TipoMovimentacao;
import com.dac.conta.repository.ContaCUDRepository;
import com.dac.conta.repository.ContaRRepository;
import com.dac.conta.repository.MovimentacaoCUDRepository;
import com.dac.conta.repository.MovimentacaoRRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DevService {

    @Autowired
    private ContaCUDRepository contaCUDRepository;

    @Autowired
    private ContaRRepository contaRRepository;

    @Autowired
    private MovimentacaoCUDRepository movimentacaoCUDRepository;

    @Autowired
    private MovimentacaoRRepository movimentacaoRRepository;

    @Transactional
    public void resetComMocks() {
        movimentacaoCUDRepository.deleteAll();
        contaCUDRepository.deleteAll();
        contaCUDRepository.saveAll(mockContasCUD());
        movimentacaoCUDRepository.saveAll(mockMovimentacoesCUD());

        movimentacaoRRepository.deleteAll();
        contaRRepository.deleteAll();
        contaRRepository.saveAll(mockContasR());
        movimentacaoRRepository.saveAll(mockMovimentacoesR());
    }

    // -------------------------
    // Mocks CUD
    // -------------------------

    private List<ContaCUD> mockContasCUD() {
        return List.of(
            contaCUD("1291", "12912861012", "Catharyna",  "98574307084", "Geniéve",     800.0,    5000.0, LocalDateTime.of(2000,  1,  1, 0, 0)),
            contaCUD("0950", "09506382000", "Cleuddônio", "64065268052", "Godophredo", -10000.0, 10000.0, LocalDateTime.of(1990, 10, 10, 0, 0)),
            contaCUD("8573", "85733854057", "Catianna",   "23862179060", "Gyândula",   -1000.0,   1500.0, LocalDateTime.of(2012, 12, 12, 0, 0)),
            contaCUD("5887", "58872160006", "Cutardo",    "98574307084", "Geniéve",   150000.0,      0.0, LocalDateTime.of(2022,  2, 22, 0, 0)),
            contaCUD("7617", "76179646090", "Coândrya",   "64065268052", "Godophredo",     0.0,   1500.0, LocalDateTime.of(2025,  1,  1, 0, 0))
        );
    }

    private List<MovimentacaoCUD> mockMovimentacoesCUD() {
        return List.of(
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "1291",   1000.0, LocalDateTime.of(2020,  1,  1, 10, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "1291",    900.0, LocalDateTime.of(2020,  1,  1, 11, 0)),
            movCUD(TipoMovimentacao.SAQUE,        "1291",   null,     550.0, LocalDateTime.of(2020,  1,  1, 12, 0)),
            movCUD(TipoMovimentacao.SAQUE,        "1291",   null,     350.0, LocalDateTime.of(2020,  1,  1, 13, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "1291",   2000.0, LocalDateTime.of(2020,  1, 10, 15, 0)),
            movCUD(TipoMovimentacao.SAQUE,        "1291",   null,     500.0, LocalDateTime.of(2020,  1, 15,  8, 0)),
            movCUD(TipoMovimentacao.TRANSFERENCIA,"1291",  "0950",   1700.0, LocalDateTime.of(2020,  1, 20, 12, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "0950",   1000.0, LocalDateTime.of(2025,  1,  1, 12, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "0950",   5000.0, LocalDateTime.of(2025,  1,  2, 10, 0)),
            movCUD(TipoMovimentacao.SAQUE,        "0950",   null,     200.0, LocalDateTime.of(2025,  1, 10, 10, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "0950",   7000.0, LocalDateTime.of(2025,  2,  5, 10, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "8573",   1000.0, LocalDateTime.of(2025,  5,  5, 10, 0)),
            movCUD(TipoMovimentacao.SAQUE,        "8573",   null,    2000.0, LocalDateTime.of(2025,  5,  6, 10, 0)),
            movCUD(TipoMovimentacao.DEPOSITO,      null,   "5887", 150000.0, LocalDateTime.of(2025,  6,  1, 10, 0))
        );
    }

    // -------------------------
    // Mocks R
    // -------------------------

    private List<ContaR> mockContasR() {
        return List.of(
            contaR("1291", "12912861012", "Catharyna",  "98574307084", "Geniéve",    new BigDecimal("800"),     new BigDecimal("5000"),  "aprovado", LocalDate.of(2000,  1,  1)),
            contaR("0950", "09506382000", "Cleuddônio", "64065268052", "Godophredo", new BigDecimal("-10000"),  new BigDecimal("10000"), "aprovado", LocalDate.of(1990, 10, 10)),
            contaR("8573", "85733854057", "Catianna",   "23862179060", "Gyândula",   new BigDecimal("-1000"),   new BigDecimal("1500"),  "aprovado", LocalDate.of(2012, 12, 12)),
            contaR("5887", "58872160006", "Cutardo",    "98574307084", "Geniéve",    new BigDecimal("150000"),  new BigDecimal("0"),     "aprovado", LocalDate.of(2022,  2, 22)),
            contaR("7617", "76179646090", "Coândrya",   "64065268052", "Godophredo", new BigDecimal("0"),       new BigDecimal("1500"),  "aprovado", LocalDate.of(2025,  1,  1))
        );
    }

    private List<MovimentacaoR> mockMovimentacoesR() {
        return List.of(
            movR("deposito",      null,   "1291", null,          "12912861012", new BigDecimal("1000"),   LocalDateTime.of(2020,  1,  1, 10, 0)),
            movR("deposito",      null,   "1291", null,          "12912861012", new BigDecimal("900"),    LocalDateTime.of(2020,  1,  1, 11, 0)),
            movR("saque",        "1291",   null,  "12912861012", null,          new BigDecimal("550"),    LocalDateTime.of(2020,  1,  1, 12, 0)),
            movR("saque",        "1291",   null,  "12912861012", null,          new BigDecimal("350"),    LocalDateTime.of(2020,  1,  1, 13, 0)),
            movR("deposito",      null,   "1291", null,          "12912861012", new BigDecimal("2000"),   LocalDateTime.of(2020,  1, 10, 15, 0)),
            movR("saque",        "1291",   null,  "12912861012", null,          new BigDecimal("500"),    LocalDateTime.of(2020,  1, 15,  8, 0)),
            movR("transferencia","1291",  "0950", "12912861012", "09506382000", new BigDecimal("1700"),   LocalDateTime.of(2020,  1, 20, 12, 0)),
            movR("deposito",      null,   "0950", null,          "09506382000", new BigDecimal("1000"),   LocalDateTime.of(2025,  1,  1, 12, 0)),
            movR("deposito",      null,   "0950", null,          "09506382000", new BigDecimal("5000"),   LocalDateTime.of(2025,  1,  2, 10, 0)),
            movR("saque",        "0950",   null,  "09506382000", null,          new BigDecimal("200"),    LocalDateTime.of(2025,  1, 10, 10, 0)),
            movR("deposito",      null,   "0950", null,          "09506382000", new BigDecimal("7000"),   LocalDateTime.of(2025,  2,  5, 10, 0)),
            movR("deposito",      null,   "8573", null,          "85733854057", new BigDecimal("1000"),   LocalDateTime.of(2025,  5,  5, 10, 0)),
            movR("saque",        "8573",   null,  "85733854057", null,          new BigDecimal("2000"),   LocalDateTime.of(2025,  5,  6, 10, 0)),
            movR("deposito",      null,   "5887", null,          "58872160006", new BigDecimal("150000"), LocalDateTime.of(2025,  6,  1, 10, 0))
        );
    }

    // -------------------------
    // Helpers
    // -------------------------

    private ContaCUD contaCUD(String numero, String clienteCpf, String clienteNome,
                               String gerenteCpf, String gerenteNome,
                               Double saldo, Double limite, LocalDateTime criacao) {
        ContaCUD c = new ContaCUD();
        c.setNumero(numero);
        c.setClienteCpf(clienteCpf);
        c.setClienteNome(clienteNome);
        c.setGerenteCpf(gerenteCpf);
        c.setGerenteNome(gerenteNome);
        c.setSaldo(saldo);
        c.setLimite(limite);
        c.setCriacao(criacao);
        return c;
    }

    private MovimentacaoCUD movCUD(TipoMovimentacao tipo, String origem, String destino,
                                    Double valor, LocalDateTime data) {
        MovimentacaoCUD m = new MovimentacaoCUD();
        m.setTipo(tipo);
        m.setOrigem(origem);
        m.setDestino(destino);
        m.setValor(valor);
        m.setData(data);
        return m;
    }

    private ContaR contaR(String numero, String clienteCpf, String clienteNome,
                           String gerenteCpf, String gerenteNome,
                           BigDecimal saldo, BigDecimal limite,
                           String status, LocalDate dataCriacao) {
        ContaR c = new ContaR();
        c.setNumero(numero);
        c.setClienteCpf(clienteCpf);
        c.setClienteNome(clienteNome);
        c.setGerenteCpf(gerenteCpf);
        c.setGerenteNome(gerenteNome);
        c.setSaldo(saldo);
        c.setLimite(limite);
        c.setStatus(status);
        c.setDataCriacao(dataCriacao);
        return c;
    }

    private MovimentacaoR movR(String tipo, String contaOrigem, String contaDestino,
                                String clienteOrigemCpf, String clienteDestinoCpf,
                                BigDecimal valor, LocalDateTime dataHora) {
        MovimentacaoR m = new MovimentacaoR();
        m.setTipo(tipo);
        m.setContaOrigem(contaOrigem);
        m.setContaDestino(contaDestino);
        m.setClienteOrigemCpf(clienteOrigemCpf);
        m.setClienteDestinoCpf(clienteDestinoCpf);
        m.setValor(valor);
        m.setDataHora(dataHora);
        return m;
    }
}