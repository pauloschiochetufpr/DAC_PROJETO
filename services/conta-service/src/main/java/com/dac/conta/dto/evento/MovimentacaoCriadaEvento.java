package com.dac.conta.dto.evento;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MovimentacaoCriadaEvento {

    private String tipo;
    private String contaOrigem;
    private String contaDestino;
    private String clienteOrigemCpf;
    private String clienteDestinoCpf;
    private BigDecimal valor;
    private LocalDateTime dataHora;

    public MovimentacaoCriadaEvento() {}

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getContaOrigem() { return contaOrigem; }
    public void setContaOrigem(String contaOrigem) { this.contaOrigem = contaOrigem; }

    public String getContaDestino() { return contaDestino; }
    public void setContaDestino(String contaDestino) { this.contaDestino = contaDestino; }

    public String getClienteOrigemCpf() { return clienteOrigemCpf; }
    public void setClienteOrigemCpf(String clienteOrigemCpf) { this.clienteOrigemCpf = clienteOrigemCpf; }

    public String getClienteDestinoCpf() { return clienteDestinoCpf; }
    public void setClienteDestinoCpf(String clienteDestinoCpf) { this.clienteDestinoCpf = clienteDestinoCpf; }

    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor = valor; }

    public LocalDateTime getDataHora() { return dataHora; }
    public void setDataHora(LocalDateTime dataHora) { this.dataHora = dataHora; }
}