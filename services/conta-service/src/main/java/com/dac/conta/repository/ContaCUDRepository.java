package com.dac.conta.repository;

import com.dac.conta.entity.ContaCUD;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ContaCUDRepository extends JpaRepository<ContaCUD, String> {
}