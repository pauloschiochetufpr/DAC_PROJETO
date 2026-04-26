package com.dac.auth.entity;

// Spring Data / MongoDB
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "sessions")
public class Session {

    @Id
    // valor do refresh token; usado como identificador único da sessão
    private String refreshId;

    // CPF do usuário dono da sessão
    private String userId;

    // fingerprint do dispositivo que originou a sessão
    private String deviceId;

    // momento em que a sessão foi criada
    private Instant issuedAt;

    // último uso do refresh token; base para cálculo de inatividade
    private Instant lastUsedAt;

    // expiração deslizante: renova a cada uso dentro do limite absoluto
    private Instant expiresAt;

    // expiração absoluta: a sessão não pode ultrapassar essa data independente de uso
    private Instant absoluteExpiresAt;

    // true quando a sessão foi invalidada (logout, rotação ou detecção de replay)
    private boolean revoked;

    public String getRefreshId() { return refreshId; }
    public void setRefreshId(String refreshId) { this.refreshId = refreshId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public Instant getIssuedAt() { return issuedAt; }
    public void setIssuedAt(Instant issuedAt) { this.issuedAt = issuedAt; }

    public Instant getLastUsedAt() { return lastUsedAt; }
    public void setLastUsedAt(Instant lastUsedAt) { this.lastUsedAt = lastUsedAt; }

    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }

    public Instant getAbsoluteExpiresAt() { return absoluteExpiresAt; }
    public void setAbsoluteExpiresAt(Instant absoluteExpiresAt) { this.absoluteExpiresAt = absoluteExpiresAt; }

    public boolean isRevoked() { return revoked; }
    public void setRevoked(boolean revoked) { this.revoked = revoked; }
}