package com.dac.gerente.dto.request;

public class AprovarClienteRequest {

    private String cpfCliente;

    public String getCpfString(){
        return cpfCliente;
    }

    public void setCpfString(String cpfCliente) {
        this.cpfCliente = cpfCliente;
    }
}
