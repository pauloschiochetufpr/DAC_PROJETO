package com.dac.gerente.repository;

import com.dac.gerente.entity.Gerente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GerenteRepository extends JpaRepository<Gerente, String> {

    boolean existsByEmail(String email);

    List<Gerente> findAllByOrderByNomeAsc();
}