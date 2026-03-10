package com.dac.conta.dto.response;

import java.time.LocalDateTime;

public class OperacaoResponseDTO {
    private String conta;
    private LocalDateTime data;
    private Double saldo;

    public String getConta() {
        return conta;
    }

    public void setConta(String conta) {
        this.conta = conta;
    }

    public LocalDateTime getData() {
        return data;
    }

    public void setData(LocalDateTime data) {
        this.data = data;
    }

    public Double getSaldo() {
        return saldo;
    }

    public void setSaldo(Double saldo) {
        this.saldo = saldo;
    }
}