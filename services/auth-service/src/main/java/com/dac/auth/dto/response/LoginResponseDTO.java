package com.dac.auth.dto.response;

public class LoginResponseDTO {

    // token JWE de acesso; expira em 10 minutos
    private String access_token;
    private String token_tipo = "bearer";

    // papel do usuário em maiúsculo (ex: "CLIENTE", "GERENTE", "ADMINISTRADOR")
    private String tipo;

    // dados básicos do usuário para exibição imediata no frontend sem nova requisição
    private UsuarioDTO usuario;

    public String getAccess_token() { return access_token; }
    public void setAccess_token(String access_token) { this.access_token = access_token; }

    public String getToken_tipo() { return token_tipo; }
    public void setToken_tipo(String token_tipo) { this.token_tipo = token_tipo; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public UsuarioDTO getUsuario() { return usuario; }
    public void setUsuario(UsuarioDTO usuario) { this.usuario = usuario; }

    public static class UsuarioDTO {
        private String nome;
        private String cpf;
        private String email;

        public String getNome() { return nome; }
        public void setNome(String nome) { this.nome = nome; }

        public String getCpf() { return cpf; }
        public void setCpf(String cpf) { this.cpf = cpf; }

        public String getEmail() { return email; }

        public void setEmail(String email) {
            this.email = email;
        }
        
    }
}