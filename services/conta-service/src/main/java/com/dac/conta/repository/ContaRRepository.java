package com.dac.conta.repository;

import com.dac.conta.entity.ContaR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface ContaRRepository extends JpaRepository<ContaR, String> {
    Optional<ContaR> findByClienteCpf(String clienteCpf);
}