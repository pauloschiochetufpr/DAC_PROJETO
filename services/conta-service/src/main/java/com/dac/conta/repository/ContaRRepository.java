package com.dac.conta.repository;

import com.dac.conta.entity.ContaR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContaRRepository extends JpaRepository<ContaR, String> {
}