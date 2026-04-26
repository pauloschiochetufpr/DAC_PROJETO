package com.dac.auth.repository;

// Spring Data / MongoDB
import org.springframework.data.mongodb.repository.MongoRepository;

import com.dac.auth.entity.Session;

import java.util.List;
import java.util.Optional;

public interface SessionRepository extends MongoRepository<Session, String> {

    // findByRefreshId | localiza sessão pelo token de refresh para rotação ou revogação
    Optional<Session> findByRefreshId(String refreshId);

    // findAllByDeviceId | retorna todas as sessões de um dispositivo (usado na revogação em massa)
    List<Session> findAllByDeviceId(String deviceId);

    // findAllByUserIdAndRevokedFalse | sessões ativas de um usuário
    List<Session> findAllByUserIdAndRevokedFalse(String userId);
}