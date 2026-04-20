package com.dac.gerente.repository;

import com.dac.gerente.entity.Gerente;
import com.dac.gerente.entity.TipoGerente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GerenteRepository extends JpaRepository<Gerente, String> {
    boolean existsByEmail(String email);
    boolean existsByEmailAndCpfNot(String email, String cpf);
    List<Gerente> findAllByOrderByNomeAsc();
    List<Gerente> findByTipo(TipoGerente tipo);
    long countByTipo(TipoGerente tipo);
}