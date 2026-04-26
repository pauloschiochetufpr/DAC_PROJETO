package com.dac.auth.dto.request;

public class ValidateRequestDTO {

    // token JWE a ser validado
    private String token;

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}