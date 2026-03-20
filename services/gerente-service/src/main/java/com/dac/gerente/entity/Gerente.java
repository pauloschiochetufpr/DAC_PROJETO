package com.dac.gerente.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "gerente")
public class Gerente {

    @Id
    private String cpf;

    private String nome;

    private String email;

    @Enumerated(EnumType.STRING)
    private TipoGerente tipo;

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
    
    public TipoGerente getTipo() {
        return tipo;
    }

    public void setTipo(TipoGerente tipo) {
        this.tipo = tipo;
    }
}

