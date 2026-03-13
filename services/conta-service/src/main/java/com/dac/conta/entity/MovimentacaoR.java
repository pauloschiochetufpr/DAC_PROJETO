package com.dac.conta.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimentacao")
public class MovimentacaoR {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "data_hora")
    private LocalDateTime dataHora;

    @Column(name = "tipo")
    private String tipo;

    @Column(name = "conta_origem")
    private String contaOrigem;

    @Column(name = "conta_destino")
    private String contaDestino;

    @Column(name = "cliente_origem_cpf")
    private String clienteOrigemCpf;

    @Column(name = "cliente_destino_cpf")
    private String clienteDestinoCpf;

    @Column(name = "valor")
    private BigDecimal valor;

    // getters e setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public void setDataHora(LocalDateTime dataHora) {
        this.dataHora = dataHora;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getContaOrigem() {
        return contaOrigem;
    }

    public void setContaOrigem(String contaOrigem) {
        this.contaOrigem = contaOrigem;
    }

    public String getContaDestino() {
        return contaDestino;
    }

    public void setContaDestino(String contaDestino) {
        this.contaDestino = contaDestino;
    }

    public String getClienteOrigemCpf() {
        return clienteOrigemCpf;
    }

    public void setClienteOrigemCpf(String clienteOrigemCpf) {
        this.clienteOrigemCpf = clienteOrigemCpf;
    }

    public String getClienteDestinoCpf() {
        return clienteDestinoCpf;
    }

    public void setClienteDestinoCpf(String clienteDestinoCpf) {
        this.clienteDestinoCpf = clienteDestinoCpf;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;

    }
}