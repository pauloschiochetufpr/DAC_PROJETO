package com.dac.cliente.repository;

import com.dac.cliente.entity.Cliente;
import com.dac.cliente.entity.StatusCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, String> {

    List<Cliente> findByStatus(StatusCliente status);

    List<Cliente> findByStatusOrderByNomeAsc(StatusCliente status);

    List<Cliente> findAllByOrderByNomeAsc();

    boolean existsByEmail(String email);

    @Query("SELECT c FROM Cliente c WHERE c.status = :status AND " +
           "(LOWER(c.nome) LIKE LOWER(CONCAT('%', :termo, '%')) OR c.cpf LIKE CONCAT('%', :termo, '%'))")
    List<Cliente> buscarPorCpfOuNome(@Param("status") StatusCliente status,
                                      @Param("termo") String termo);
}