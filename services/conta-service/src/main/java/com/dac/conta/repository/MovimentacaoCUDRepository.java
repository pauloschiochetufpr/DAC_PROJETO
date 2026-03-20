package com.dac.conta.repository;

import com.dac.conta.entity.MovimentacaoCUD;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimentacaoCUDRepository extends JpaRepository<MovimentacaoCUD, Long> {
}