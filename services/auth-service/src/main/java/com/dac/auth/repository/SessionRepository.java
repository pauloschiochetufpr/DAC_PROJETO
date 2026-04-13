<<<<<<< HEAD
package com.dac.auth.repository;

import com.dac.auth.entity.Session;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface SessionRepository extends MongoRepository<Session, String> {
    Optional<Session> findByRefreshId(String refreshId);
    List<Session> findAllByDeviceId(String deviceId);
    List<Session> findAllByUserIdAndRevokedFalse(String userId);
=======
package com.dac.auth.repository;

import com.dac.auth.entity.Session;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface SessionRepository extends MongoRepository<Session, String> {
    Optional<Session> findByRefreshId(String refreshId);
    List<Session> findAllByDeviceId(String deviceId);
    List<Session> findAllByUserIdAndRevokedFalse(String userId);
>>>>>>> ae1ecff4725c810e7a5867f07b315e2cab485cf9
}