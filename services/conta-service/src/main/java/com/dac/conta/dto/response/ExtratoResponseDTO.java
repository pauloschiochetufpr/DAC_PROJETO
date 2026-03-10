package com.dac.conta.dto.response;

import java.util.List;

public class ExtratoResponseDTO {
    private String conta;
    private Double saldo;
    private List<ItemExtratoResponseDTO> movimentacoes;

    public String getConta() {
        return conta;
    }

    public void setConta(String conta) {
        this.conta = conta;
    }

    public Double getSaldo() {
        return saldo;
    }

    public void setSaldo(Double saldo) {
        this.saldo = saldo;
    }

    public List<ItemExtratoResponseDTO> getMovimentacoes() {
        return movimentacoes;
    }

    public void setMovimentacoes(List<ItemExtratoResponseDTO> movimentacoes) {
        this.movimentacoes = movimentacoes;
    }
}