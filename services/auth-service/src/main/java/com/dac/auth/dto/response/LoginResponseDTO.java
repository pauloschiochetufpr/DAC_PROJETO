package com.dac.auth.dto.response;

public class LoginResponseDTO {
    private String access_token;
    private String token_tipo = "bearer";
    private String tipo;
    private UsuarioDTO usuario;

    public String getAccess_token() { return access_token; }
    public void setAccess_token(String access_token) { this.access_token = access_token; }

    public String geToken_tipo() { return token_tipo; }
    public void setToken_tipo(String token_tipo) { this.token_tipo = token_tipo; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public UsuarioDTO getUsuario() { return usuario; }
    public void setUsuario(UsuarioDTO usuario) { this.usuario = usuario; }

    // classe interna representando o objeto usuario
    public static class UsuarioDTO {
        private String cpf;
        private String email;
        private String tipo;

        public String getCpf() { return cpf; }
        public void setCpf(String cpf) { this.cpf = cpf; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }
    }
}