package com.dac.conta.dto.request;

// CriarContaRequestDTO | dados que a saga manda pro conta criar a conta.
// Database per Service: o nome do cliente/gerente vem DENTRO do pedido - o conta NÃO
// consulta o cliente_db, ele recebe o dado pronto.
public class CriarContaRequestDTO {
    private String clienteCpf;
    private String clienteNome;
    private String gerenteCpf;
    private String gerenteNome;
    private Double limite;

    public String getClienteCpf() { return clienteCpf; }
    public void setClienteCpf(String clienteCpf) { this.clienteCpf = clienteCpf; }

    public String getClienteNome() { return clienteNome; }
    public void setClienteNome(String clienteNome) { this.clienteNome = clienteNome; }

    public String getGerenteCpf() { return gerenteCpf; }
    public void setGerenteCpf(String gerenteCpf) { this.gerenteCpf = gerenteCpf; }

    public String getGerenteNome() { return gerenteNome; }
    public void setGerenteNome(String gerenteNome) { this.gerenteNome = gerenteNome; }

    public Double getLimite() { return limite; }
    public void setLimite(Double limite) { this.limite = limite; }
}