package com.dac.cliente.dto.response;

public class DadosClienteResponseDTO {
    private String cpf;
    private String nome;
    private String telefone;
    private String email;
    private String endereco;
    private String cep;
    private String cidade;
    private String estado;
    private Double salario;
    private String conta;
    private Double saldo;
    private Double limite;
    private String gerente;
    private String gerente_nome;
    private String gerente_email;

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

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEndereco() {
        return endereco;
    }

    public void setEndereco(String endereco) {
        this.endereco = endereco;
    }

    public String getCep() {
        return cep;
    }

    public void setCep(String cep) {
        this.cep = cep;
    }

    public String getCidade() {
        return cidade;
    }

    public void setCidade(String cidade) {
        this.cidade = cidade;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Double getSalario() {
        return salario;
    }

    public void setSalario(Double salario) {
        this.salario = salario;
    }

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

    public Double getLimite() {
        return limite;
    }

    public void setLimite(Double limite) {
        this.limite = limite;
    }

    public String getGerente() {
        return gerente;
    }

    public void setGerente(String gerente) {
        this.gerente = gerente;
    }

    public String getGerente_nome() {
        return gerente_nome;
    }

    public void setGerente_nome(String gerente_nome) {
        this.gerente_nome = gerente_nome;
    }

    public String getGerente_email() {
        return gerente_email;
    }

    public void setGerente_email(String gerente_email) {
        this.gerente_email = gerente_email;
    }
}