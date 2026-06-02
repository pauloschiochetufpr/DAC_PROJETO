package com.dac.conta.repository;

import com.dac.conta.entity.ContaCUD;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContaCUDRepository extends JpaRepository<ContaCUD, String> {

    List<ContaCUD> findByGerenteCpf(String gerenteCpf);

    Optional<ContaCUD> findByClienteCpf(String clienteCpf);

    // Contagem de contas por gerente: { cpfGerente -> quantidade }
    @Query("SELECT c.gerenteCpf, COUNT(c) FROM ContaCUD c GROUP BY c.gerenteCpf")
    List<Object[]> contarContasPorGerente();

    // Soma de saldos positivos por gerente: saldo > 0 → saldo; saldo = 0 → limite; saldo < 0 → 0
    @Query("SELECT c.gerenteCpf, COALESCE(SUM(CASE WHEN c.saldo > 0 THEN c.saldo WHEN c.saldo = 0 THEN c.limite ELSE 0 END), 0) " +
           "FROM ContaCUD c GROUP BY c.gerenteCpf")
    List<Object[]> somarSaldosPositivosPorGerente();

    // Soma de saldos negativos por gerente: { cpfGerente -> somaNegativo }
    @Query("SELECT c.gerenteCpf, COALESCE(SUM(CASE WHEN c.saldo < 0 THEN c.saldo ELSE 0 END), 0) " +
           "FROM ContaCUD c GROUP BY c.gerenteCpf")
    List<Object[]> somarSaldosNegativosPorGerente();

    // Conta com menor número de contas excluindo um gerente específico
    @Query("SELECT c.gerenteCpf FROM ContaCUD c WHERE c.gerenteCpf <> :excluir " +
           "GROUP BY c.gerenteCpf ORDER BY COUNT(c) ASC")
    List<String> gerentesOrdenadosPorQuantidadeExcluindo(@Param("excluir") String excluir);

    // Buscar uma conta do gerente origem para redistribuir
    @Query("SELECT c FROM ContaCUD c WHERE c.gerenteCpf = :gerenteCpf ORDER BY c.numero ASC")
    List<ContaCUD> findByGerenteCpfOrdenado(@Param("gerenteCpf") String gerenteCpf);
}