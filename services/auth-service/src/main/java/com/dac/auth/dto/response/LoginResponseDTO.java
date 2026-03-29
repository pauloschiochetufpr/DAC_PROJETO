package com.dac.auth.dto.response;

public class LoginResponseDTO {
    private String access_token;
    private String token_type = "bearer";
    private String tipo;
    private UsuarioDTO usuario;
    private String deviceId;

    public String getAccess_token() { return access_token; }
    public void setAccess_token(String access_token) { this.access_token = access_token; }
    public String getToken_type() { return token_type; }
    public void setToken_type(String token_type) { this.token_type = token_type; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public UsuarioDTO getUsuario() { return usuario; }
    public void setUsuario(UsuarioDTO usuario) { this.usuario = usuario; }
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

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