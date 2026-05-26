package com.dac.auth.dto.request;

public class LoginRequestDTO {

    private String email;
    private String password;

    // fingerprint SHA-256 gerado pelo frontend para rastreamento de dispositivo
    private String deviceId;

    // nome amigável do dispositivo enviado pelo frontend (ex: "Chrome - Windows")
    private String deviceName;

    // Fallback para o script PyTest (login e senha)
    private String login;
    private String senha;

    public String getEmail() { 
        return email != null && !email.isBlank() ? email : login; 
    }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { 
        return password != null && !password.isBlank() ? password : senha; 
    }
    public void setPassword(String password) { this.password = password; }

    public String getDeviceId() { 
        if (deviceId != null && !deviceId.isBlank()) {
            return deviceId;
        }
        String mail = getEmail();
        if (mail != null && !mail.isBlank()) {
            return "testdevice" + Math.abs(mail.hashCode());
        }
        return "test_device_default";
    }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getDeviceName() { 
        if (deviceName != null && !deviceName.isBlank()) {
            return deviceName;
        }
        return "PyTestRunner";
    }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
}