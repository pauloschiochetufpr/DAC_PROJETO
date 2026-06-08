package com.dac.auth.dto.response;

public class BotLoginResponseDTO {

    // token JWE de acesso
    private String access_token;

    // campo "token_type" conforme padrão esperado pelo bot
    private String token_type = "bearer";

    // papel do usuário em maiúsculo (ex: "CLIENTE", "GERENTE", "ADMINISTRADOR")
    private String tipo;

    // dados mínimos esperados pelo bot
    private UsuarioDTO usuario;

    public String getAccess_token() { return access_token; }
    public void setAccess_token(String access_token) { this.access_token = access_token; }

    public String getToken_type() { return token_type; }
    public void setToken_type(String token_type) { this.token_type = token_type; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public UsuarioDTO getUsuario() { return usuario; }
    public void setUsuario(UsuarioDTO usuario) { this.usuario = usuario; }

    public static class UsuarioDTO {
        // apenas cpf e email conforme contrato esperado pelo bot
        private String cpf;
        private String email;

        public String getCpf() { return cpf; }
        public void setCpf(String cpf) { this.cpf = cpf; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }
}
