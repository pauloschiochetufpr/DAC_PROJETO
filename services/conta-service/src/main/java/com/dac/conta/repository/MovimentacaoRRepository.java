package com.dac.conta.repository;

import com.dac.conta.entity.MovimentacaoR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimentacaoRRepository extends JpaRepository<MovimentacaoR, Long> {
}