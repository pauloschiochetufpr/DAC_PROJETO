package com.dac.conta.dto.request;

public class AtualizarLimiteRequestDTO {
    private String clienteCpf;
    private Double novoLimite;
    private Double novoSalario;

    public String getClienteCpf() { return clienteCpf; }
    public void setClienteCpf(String clienteCpf) { this.clienteCpf = clienteCpf; }

    public Double getNovoLimite() { return novoLimite; }
    public void setNovoLimite(Double novoLimite) { this.novoLimite = novoLimite; }

    public Double getNovoSalario() { return novoSalario; }
    public void setNovoSalario(Double novoSalario) { this.novoSalario = novoSalario; }
}