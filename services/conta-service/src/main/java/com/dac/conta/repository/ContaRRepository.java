package com.dac.conta.repository;

import com.dac.conta.entity.ContaR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContaRRepository extends JpaRepository<ContaR, String> {

    Optional<ContaR> findByClienteCpf(String clienteCpf);

    List<ContaR> findByGerenteCpf(String gerenteCpf);

    // Para dashboard do administrador (R15): soma positivos e negativos por gerente
    @Query("SELECT c.gerenteCpf, " +
           "COALESCE(SUM(CASE WHEN c.saldo >= 0 THEN c.saldo ELSE 0 END), 0), " +
           "COALESCE(SUM(CASE WHEN c.saldo < 0 THEN c.saldo ELSE 0 END), 0), " +
           "COUNT(c) FROM ContaR c GROUP BY c.gerenteCpf")
    List<Object[]> resumoPorGerente();
}