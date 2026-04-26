package com.dac.auth.dto.request;

public class RefreshRequestDTO {

    // deviceId enviado pelo frontend no refresh; usado para validar mismatch de dispositivo
    private String deviceIdOut;

    public String getDeviceId() { return deviceIdOut; }
    public void setDeviceId(String deviceId) { this.deviceIdOut = deviceId; }
}