package com.dac.conta.service;

import com.dac.conta.entity.Conta;
import com.dac.conta.entity.Movimentacao;
import com.dac.conta.entity.TipoMovimentacao;
import com.dac.conta.repository.ContaRepository;
import com.dac.conta.repository.MovimentacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DevService {

    @Autowired
    private ContaRepository contaRepository;

    @Autowired
    private MovimentacaoRepository movimentacaoRepository;

    @Transactional
    public void resetComMocks() {
        movimentacaoRepository.deleteAll();
        contaRepository.deleteAll();

        contaRepository.saveAll(mockContas());
        movimentacaoRepository.saveAll(mockMovimentacoes());
    }

    private List<Conta> mockContas() {
        return List.of(
            conta("1291", "12912861012", "98574307084",  800.0,  5000.0, LocalDateTime.of(2000,  1,  1, 0, 0)),
            conta("0950", "09506382000", "64065268052", -10000.0, 10000.0, LocalDateTime.of(1990, 10, 10, 0, 0)),
            conta("8573", "85733854057", "23862179060", -1000.0,  1500.0, LocalDateTime.of(2012, 12, 12, 0, 0)),
            conta("5887", "58872160006", "98574307084", 150000.0,    0.0, LocalDateTime.of(2022,  2, 22, 0, 0)),
            conta("7617", "76179646090", "64065268052",     0.0,  1500.0, LocalDateTime.of(2025,  1,  1, 0, 0))
        );
    }

    private List<Movimentacao> mockMovimentacoes() {
        return List.of(
            mov(TipoMovimentacao.DEPOSITO,      null,   "1291", 1000.0, LocalDateTime.of(2020,  1,  1, 10, 0)),
            mov(TipoMovimentacao.DEPOSITO,      null,   "1291",  900.0, LocalDateTime.of(2020,  1,  1, 11, 0)),
            mov(TipoMovimentacao.SAQUE,        "1291",   null,   550.0, LocalDateTime.of(2020,  1,  1, 12, 0)),
            mov(TipoMovimentacao.SAQUE,        "1291",   null,   350.0, LocalDateTime.of(2020,  1,  1, 13, 0)),
            mov(TipoMovimentacao.DEPOSITO,      null,   "1291", 2000.0, LocalDateTime.of(2020,  1, 10, 15, 0)),
            mov(TipoMovimentacao.SAQUE,        "1291",   null,   500.0, LocalDateTime.of(2020,  1, 15,  8, 0)),
            mov(TipoMovimentacao.TRANSFERENCIA,"1291",  "0950", 1700.0, LocalDateTime.of(2020,  1, 20, 12, 0)),
            mov(TipoMovimentacao.DEPOSITO,      null,   "0950", 1000.0, LocalDateTime.of(2025,  1,  1, 12, 0)),
            mov(TipoMovimentacao.DEPOSITO,      null,   "0950", 5000.0, LocalDateTime.of(2025,  1,  2, 10, 0)),
            mov(TipoMovimentacao.SAQUE,        "0950",   null,   200.0, LocalDateTime.of(2025,  1, 10, 10, 0)),
            mov(TipoMovimentacao.DEPOSITO,      null,   "0950", 7000.0, LocalDateTime.of(2025,  2,  5, 10, 0)),
            mov(TipoMovimentacao.DEPOSITO,      null,   "8573", 1000.0, LocalDateTime.of(2025,  5,  5, 10, 0)),
            mov(TipoMovimentacao.SAQUE,        "8573",   null,  2000.0, LocalDateTime.of(2025,  5,  6, 10, 0)),
            mov(TipoMovimentacao.DEPOSITO,      null,   "5887", 150000.0, LocalDateTime.of(2025, 6,  1, 10, 0))
        );
    }

    private Conta conta(String numero, String clienteCpf, String gerenteCpf,
                        Double saldo, Double limite, LocalDateTime criacao) {
        Conta c = new Conta();
        c.setNumero(numero);
        c.setClienteCpf(clienteCpf);
        c.setGerenteCpf(gerenteCpf);
        c.setSaldo(saldo);
        c.setLimite(limite);
        c.setCriacao(criacao);
        return c;
    }

    private Movimentacao mov(TipoMovimentacao tipo, String origem, String destino,
                              Double valor, LocalDateTime data) {
        Movimentacao m = new Movimentacao();
        m.setTipo(tipo);
        m.setOrigem(origem);
        m.setDestino(destino);
        m.setValor(valor);
        m.setData(data);
        return m;
    }
}