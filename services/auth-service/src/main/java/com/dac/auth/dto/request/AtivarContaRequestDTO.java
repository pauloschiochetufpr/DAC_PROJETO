package com.dac.auth.dto.request;

public class AtivarContaRequestDTO {
    private String token;
    private String senha;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getSenha() {
        return senha;
    }

    public void setSenha(String senha) {
        this.senha = senha;
    }
}
