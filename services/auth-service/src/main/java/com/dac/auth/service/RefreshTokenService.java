package com.dac.auth.service;

import com.dac.auth.entity.Device;
import com.dac.auth.entity.Session;
import com.dac.auth.repository.DeviceRepository;
import com.dac.auth.repository.SessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private static final long SLIDING_DAYS = 30;
    private static final long ABSOLUTE_DAYS = 90;
    private static final long INACTIVITY_DAYS = 30;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    public Session createSession(String userId, String deviceId) {
        Session session = new Session();
        session.setRefreshId(UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setDeviceId(deviceId);
        session.setIssuedAt(Instant.now());
        session.setLastUsedAt(Instant.now());
        session.setExpiresAt(Instant.now().plusSeconds(SLIDING_DAYS * 24 * 3600));
        session.setAbsoluteExpiresAt(Instant.now().plusSeconds(ABSOLUTE_DAYS * 24 * 3600));
        session.setRevoked(false);
        return sessionRepository.save(session);
    }

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

    public Session rotateSession(String refreshId, String incomingDeviceId, String ip) {
        Session session = sessionRepository.findByRefreshId(refreshId)
            .orElseThrow(() -> new SecurityException("INVALID_TOKEN"));

        if (session.isRevoked()) {
            handleReplay(session.getDeviceId(), session.getUserId());
            throw new SecurityException("REPLAY_DETECTED");
        }

        Device device = deviceRepository.findByDeviceId(session.getDeviceId())
            .orElseThrow(() -> new SecurityException("DEVICE_NOT_FOUND"));

        if (device.isBlacklisted()) {
            throw new SecurityException("DEVICE_BLACKLISTED");
        }

        if (!session.getDeviceId().equals(incomingDeviceId)) {
            revokeAllSessionsOfDevice(session.getDeviceId());
            device.setBlacklisted(true);
            deviceRepository.save(device);
            throw new SecurityException("DEVICE_MISMATCH");
        }

        if (Instant.now().isAfter(session.getAbsoluteExpiresAt())) {
            session.setRevoked(true);
            sessionRepository.save(session);
            throw new SecurityException("ABSOLUTE_EXPIRED");
        }

        if (Instant.now().isAfter(session.getExpiresAt())) {
            session.setRevoked(true);
            sessionRepository.save(session);
            throw new SecurityException("SESSION_EXPIRED");
        }

        Instant inactivityLimit = session.getLastUsedAt()
            .plusSeconds(INACTIVITY_DAYS * 24 * 3600);
        if (Instant.now().isAfter(inactivityLimit)) {
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
        newSession.setExpiresAt(Instant.now().plusSeconds(SLIDING_DAYS * 24 * 3600));
        newSession.setAbsoluteExpiresAt(session.getAbsoluteExpiresAt());
        newSession.setRevoked(false);
        return sessionRepository.save(newSession);
    }

    public void revokeSession(String refreshId) {
        sessionRepository.findByRefreshId(refreshId).ifPresent(session -> {
            session.setRevoked(true);
            sessionRepository.save(session);
        });
    }

    private void handleReplay(String deviceId, String userId) {
        revokeAllSessionsOfDevice(deviceId);
        deviceRepository.findByDeviceId(deviceId).ifPresent(device -> {
            device.setBlacklisted(true);
            deviceRepository.save(device);
        });
    }

    private void revokeAllSessionsOfDevice(String deviceId) {
        List<Session> sessions = sessionRepository.findAllByDeviceId(deviceId);
        sessions.forEach(s -> s.setRevoked(true));
        sessionRepository.saveAll(sessions);
    }
}