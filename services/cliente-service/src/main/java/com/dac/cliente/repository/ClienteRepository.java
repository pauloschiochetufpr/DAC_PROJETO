package com.dac.cliente.repository;

import com.dac.cliente.entity.Cliente;
import com.dac.cliente.entity.StatusCliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, String> {
    List<Cliente> findByStatus(StatusCliente status);
    List<Cliente> findByStatusOrderByNomeAsc(StatusCliente status);
    List<Cliente> findAllByOrderByNomeAsc();
}