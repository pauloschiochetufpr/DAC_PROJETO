package com.dac.auth.repository;

// Spring Data / MongoDB
import org.springframework.data.mongodb.repository.MongoRepository;

import com.dac.auth.entity.Device;

import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends MongoRepository<Device, String> {

    // findByDeviceId | localiza dispositivo pelo fingerprint para validação ou blacklist
    Optional<Device> findByDeviceId(String deviceId);

    // findAllByUserId | retorna todos os dispositivos associados a um usuário
    List<Device> findAllByUserId(String userId);
}