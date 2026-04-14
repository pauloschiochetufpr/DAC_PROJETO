package com.dac.conta.dto.evento;

import java.math.BigDecimal;

public class ContaAtualizadaEvento {

    private String numero;
    private String clienteCpf;
    private String clienteNome;
    private String gerenteCpf;
    private String gerenteNome;
    private BigDecimal saldo;
    private BigDecimal limite;
    private String status;

    public ContaAtualizadaEvento() {}

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getClienteCpf() { return clienteCpf; }
    public void setClienteCpf(String clienteCpf) { this.clienteCpf = clienteCpf; }

    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }

    public String getGerenteCpf() { return gerenteCpf; }
    public void setGerenteCpf(String gerenteCpf) { this.gerenteCpf = gerenteCpf; }

    public String getGerenteNome() { return gerenteNome; }
    public void setGerenteNome(String gerenteNome) { this.gerenteNome = gerenteNome; }

    public BigDecimal getSaldo() { return saldo; }
    public void setSaldo(BigDecimal saldo) { this.saldo = saldo; }

    public BigDecimal getLimite() { return limite; }
    public void setLimite(BigDecimal limite) { this.limite = limite; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}