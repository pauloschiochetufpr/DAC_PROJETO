package com.dac.auth.dto.request;

public class LoginRequestDTO {
    private String email;
    private String password;
    private String deviceId;
    private String deviceName;
    private String ip;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getIp() { return ip; }
    public void setIp(String ip) { this.ip = ip; }
}