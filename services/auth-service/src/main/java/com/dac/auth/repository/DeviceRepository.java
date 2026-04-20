package com.dac.auth.repository;

import com.dac.auth.entity.Device;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends MongoRepository<Device, String> {
    Optional<Device> findByDeviceId(String deviceId);
    List<Device> findAllByUserId(String userId);
}