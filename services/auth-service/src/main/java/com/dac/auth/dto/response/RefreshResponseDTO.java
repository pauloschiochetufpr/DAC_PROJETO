package com.dac.auth.dto.response;

public class RefreshResponseDTO {
    private String access_token;
    private String token_tipo = "bearer";

    public String getAccess_token() { return access_token; }
    public void setAccess_token(String access_token) { this.access_token = access_token; }

    public String getToken_tipo() { return token_tipo; }
    public void setToken_tipo(String token_tipo) { this.token_tipo = token_tipo; }
}