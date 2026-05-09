package com.dac.conta.dto.request;

public class RedistribuirRequestDTO {
    private String gerenteOrigemCpf;
    private String gerenteDestinoCpf;
    private String gerenteDestinoNome;
    private int quantidade; // 1 = transfere 1 conta, -1 = transfere todas

    public String getGerenteOrigemCpf() { return gerenteOrigemCpf; }
    public void setGerenteOrigemCpf(String gerenteOrigemCpf) { this.gerenteOrigemCpf = gerenteOrigemCpf; }

    public String getGerenteDestinoCpf() { return gerenteDestinoCpf; }
    public void setGerenteDestinoCpf(String gerenteDestinoCpf) { this.gerenteDestinoCpf = gerenteDestinoCpf; }

    public String getGerenteDestinoNome() { return gerenteDestinoNome; }
    public void setGerenteDestinoNome(String gerenteDestinoNome) { this.gerenteDestinoNome = gerenteDestinoNome; }

    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }
}