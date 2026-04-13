<<<<<<< HEAD
package com.dac.auth.repository;

import com.dac.auth.entity.Device;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends MongoRepository<Device, String> {
    Optional<Device> findByDeviceId(String deviceId);
    List<Device> findAllByUserId(String userId);
=======
package com.dac.auth.repository;

import com.dac.auth.entity.Device;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface DeviceRepository extends MongoRepository<Device, String> {
    Optional<Device> findByDeviceId(String deviceId);
    List<Device> findAllByUserId(String userId);
>>>>>>> ae1ecff4725c810e7a5867f07b315e2cab485cf9
}