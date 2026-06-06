package com.dac.auth.service;

// entidades
import com.dac.auth.entity.Device;
import com.dac.auth.entity.Session;
// repositórios
import com.dac.auth.repository.DeviceRepository;
import com.dac.auth.repository.SessionRepository;
// util
import com.dac.auth.util.DevLog;
// Spring
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class RefreshTokenService {

    // janela deslizante: cada uso renova a expiração por esse período
    private static final long SLIDING_HOURS    = 12;
    // limite absoluto: a sessão não pode ser usada além desse tempo desde a criação
    private static final long ABSOLUTE_HOURS   = 36;
    // inatividade: sessão revogada se não usada dentro desse intervalo
    private static final long INACTIVITY_HOURS = 12;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    // createSession | cria uma nova sessão de refresh para o usuário e dispositivo informados
    public Session createSession(String userId, String deviceId) {
        Session session = new Session();
        session.setRefreshId(UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setDeviceId(deviceId);
        session.setIssuedAt(Instant.now());
        session.setLastUsedAt(Instant.now());
        session.setExpiresAt(Instant.now().plusSeconds(SLIDING_HOURS * 3600));
        session.setAbsoluteExpiresAt(Instant.now().plusSeconds(ABSOLUTE_HOURS * 3600));
        session.setRevoked(false);
        return sessionRepository.save(session);
    }

    // registerOrUpdateDevice | registra um novo dispositivo ou atualiza lastSeen e IP do existente
    public Device registerOrUpdateDevice(String userId, String deviceId,
                                         String deviceName, String ip) {
        return deviceRepository.findByDeviceId(deviceId)
            .map(existing -> {
                existing.setLastSeen(Instant.now());
                existing.setIpLast(ip);
                return deviceRepository.save(existing);
            })
            .orElseGet(() -> {
                Device device = new Device();
                device.setDeviceId(deviceId);
                device.setUserId(userId);
                device.setDeviceName(deviceName);
                device.setFirstSeen(Instant.now());
                device.setLastSeen(Instant.now());
                device.setIpLast(ip);
                device.setRevoked(false);
                device.setBlacklisted(false);
                return deviceRepository.save(device);
            });
    }

    // rotateSession | valida o refresh token, verifica dispositivo e emite nova sessão (invalidando a anterior)
    public Session rotateSession(String refreshId, String incomingDeviceId, String ip) {
        DevLog.log("Iniciando rotaçao de sessao - deviceId: " + incomingDeviceId + ", ip: " + ip);

        Session session = sessionRepository.findByRefreshId(refreshId)
            .orElseThrow(() -> {
                DevLog.log("rotateSession falhou - refreshId nao encontrado");
                return new SecurityException("INVALID_TOKEN");
            });

        if (session.isRevoked()) {
            DevLog.log("REPLAY DETECTADO - deviceId: " + session.getDeviceId() + ", userId: " + session.getUserId() + " - blacklistando dispositivo");
            handleReplay(session.getDeviceId(), session.getUserId());
            throw new SecurityException("REPLAY_DETECTED");
        }

        Device device = deviceRepository.findByDeviceId(session.getDeviceId())
            .orElseThrow(() -> {
                DevLog.log("rotateSession falhou - dispositivo nao encontrado: " + session.getDeviceId());
                return new SecurityException("DEVICE_NOT_FOUND");
            });

        if (device.isBlacklisted()) {
            DevLog.log("rotateSession bloqueado - dispositivo blacklistado: " + device.getDeviceId() + ", userId: " + session.getUserId());
            throw new SecurityException("DEVICE_BLACKLISTED");
        }

        if (!session.getDeviceId().equals(incomingDeviceId)) {
            DevLog.log("DEVICE_MISMATCH - sessao deviceId: " + session.getDeviceId() + ", informado: " + incomingDeviceId + " - revogando todas as sessoes e blacklistando");
            revokeAllSessionsOfDevice(session.getDeviceId());
            device.setBlacklisted(true);
            deviceRepository.save(device);
            throw new SecurityException("DEVICE_MISMATCH");
        }

        if (Instant.now().isAfter(session.getAbsoluteExpiresAt())) {
            DevLog.log("Sessao expirada (limite absoluto) - deviceId: " + session.getDeviceId() + ", expirou em: " + session.getAbsoluteExpiresAt());
            session.setRevoked(true);
            sessionRepository.save(session);
            throw new SecurityException("ABSOLUTE_EXPIRED");
        }

        if (Instant.now().isAfter(session.getExpiresAt())) {
            DevLog.log("Sessao expirada (sliding window) - deviceId: " + session.getDeviceId() + ", expirou em: " + session.getExpiresAt());
            session.setRevoked(true);
            sessionRepository.save(session);
            throw new SecurityException("SESSION_EXPIRED");
        }

        Instant inactivityLimit = session.getLastUsedAt().plusSeconds(INACTIVITY_HOURS * 3600);
        if (Instant.now().isAfter(inactivityLimit)) {
            DevLog.log("Sessao expirada por inatividade - deviceId: " + session.getDeviceId() + ", ultimo uso: " + session.getLastUsedAt());
            session.setRevoked(true);
            sessionRepository.save(session);
            throw new SecurityException("INACTIVITY_EXPIRED");
        }

        session.setRevoked(true);
        sessionRepository.save(session);

        device.setLastSeen(Instant.now());
        device.setIpLast(ip);
        deviceRepository.save(device);

        Session newSession = new Session();
        newSession.setRefreshId(UUID.randomUUID().toString());
        newSession.setUserId(session.getUserId());
        newSession.setDeviceId(session.getDeviceId());
        newSession.setIssuedAt(Instant.now());
        newSession.setLastUsedAt(Instant.now());
        newSession.setExpiresAt(Instant.now().plusSeconds(SLIDING_HOURS * 3600));
        newSession.setAbsoluteExpiresAt(session.getAbsoluteExpiresAt());
        newSession.setRevoked(false);
        Session saved = sessionRepository.save(newSession);
        DevLog.log("Sessao rotacionada com sucesso - deviceId: " + saved.getDeviceId() + ", userId: " + saved.getUserId());
        return saved;
    }

    // revokeSession | invalida uma sessão pelo refreshId (chamado no logout)
    public void revokeSession(String refreshId) {
        sessionRepository.findByRefreshId(refreshId).ifPresent(session -> {
            DevLog.log("Revogando sessao - deviceId: " + session.getDeviceId() + ", userId: " + session.getUserId());
            session.setRevoked(true);
            sessionRepository.save(session);
        });
    }

    // handleReplay | resposta a reutilização de token já revogado: blacklista o dispositivo e revoga todas as sessões
    private void handleReplay(String deviceId, String userId) {
        revokeAllSessionsOfDevice(deviceId);
        deviceRepository.findByDeviceId(deviceId).ifPresent(device -> {
            device.setBlacklisted(true);
            deviceRepository.save(device);
        });
    }

    // revokeAllSessionsOfDevice | marca todas as sessões de um dispositivo como revogadas
    private void revokeAllSessionsOfDevice(String deviceId) {
        List<Session> sessions = sessionRepository.findAllByDeviceId(deviceId);
        sessions.forEach(s -> s.setRevoked(true));
        sessionRepository.saveAll(sessions);
    }
}