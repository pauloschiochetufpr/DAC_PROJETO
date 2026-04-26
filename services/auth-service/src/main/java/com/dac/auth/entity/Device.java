package com.dac.auth.entity;

// Spring Data / MongoDB
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "devices")
public class Device {

    @Id
    // SHA-256 do hardware fingerprint enviado pelo frontend
    private String deviceId;

    // CPF do usuário dono do dispositivo
    private String userId;

    // nome legível do dispositivo (ex: "Chrome - Windows")
    private String deviceName;

    // data do primeiro registro do dispositivo
    private Instant firstSeen;

    // data do último uso; atualizado a cada refresh
    private Instant lastSeen;

    // último IP de onde o dispositivo fez requisição
    private String ipLast;

    // revogado manualmente pelo usuário ou admin
    private boolean revoked;

    // bloqueado por comportamento suspeito (mismatch ou replay detectado)
    private boolean blacklisted;

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public Instant getFirstSeen() { return firstSeen; }
    public void setFirstSeen(Instant firstSeen) { this.firstSeen = firstSeen; }

    public Instant getLastSeen() { return lastSeen; }
    public void setLastSeen(Instant lastSeen) { this.lastSeen = lastSeen; }

    public String getIpLast() { return ipLast; }
    public void setIpLast(String ipLast) { this.ipLast = ipLast; }

    public boolean isRevoked() { return revoked; }
    public void setRevoked(boolean revoked) { this.revoked = revoked; }

    public boolean isBlacklisted() { return blacklisted; }
    public void setBlacklisted(boolean blacklisted) { this.blacklisted = blacklisted; }
}