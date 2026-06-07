package com.dac.auth.dto.request;

// Jackson
import com.fasterxml.jackson.annotation.JsonAlias;

public class LoginRequestDTO {

    // aceita "email" (frontend) ou "login"
    @JsonAlias("login")
    private String email;

    // aceita "password" (frontend) ou "senha"
    @JsonAlias("senha")
    private String password;

    // fingerprint SHA-256 gerado pelo frontend para rastreamento de dispositivo
    private String deviceId;

    // nome amigável do dispositivo enviado pelo frontend (ex: "Chrome - Windows")
    private String deviceName;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }
}