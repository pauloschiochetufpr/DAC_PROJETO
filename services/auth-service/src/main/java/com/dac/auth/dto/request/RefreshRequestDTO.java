package com.dac.auth.dto.request;

public class RefreshRequestDTO {
    private String deviceId;  // frontend manda o deviceId guardado

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
}