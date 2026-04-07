package com.dac.auth.service;

import com.dac.auth.entity.Device;
import com.dac.auth.entity.Session;
import com.dac.auth.repository.DeviceRepository;
import com.dac.auth.repository.SessionRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private static final long SLIDING_DAYS = 30;
    private static final long ABSOLUTE_DAYS = 90;

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

    public void revokeSession(String refreshId) {
        sessionRepository.findByRefreshId(refreshId).ifPresent(session -> {
            session.setRevoked(true);
            sessionRepository.save(session);
        });

    }
}