package com.dac.gerente.dto.response;

import java.util.List;

public class ItemDashboardResponse {

    private DadoGerente gerente;
    private List<Object> clientes;
    private Double saldo_positivo;
    private Double saldo_negativo;

    public ItemDashboardResponse() {}

    public DadoGerente getGerente() {
        return gerente;
    }

    public void setGerente(DadoGerente gerente) {
        this.gerente = gerente;
    }

    public List<Object> getClientes() {
        return clientes;
    }

    public void setClientes(List<Object> clientes) {
        this.clientes = clientes;
    }

    public Double getSaldo_positivo() {
        return saldo_positivo;
    }

    public void setSaldo_positivo(Double saldo_positivo) {
        this.saldo_positivo = saldo_positivo;
    }

    public Double getSaldo_negativo() {
        return saldo_negativo;
    }

    public void setSaldo_negativo(Double saldo_negativo) {
        this.saldo_negativo = saldo_negativo;
    }
}