package com.dac.conta.read.repository;

import com.dac.conta.read.entity.MovimentacaoR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimentacaoRRepository extends JpaRepository<MovimentacaoR, Long> {

    List<MovimentacaoR> findByContaOrigemOrContaDestinoOrderByDataHoraAsc(
        String contaOrigem, String contaDestino);

    List<MovimentacaoR> findByContaOrigemOrContaDestinoAndDataHoraBetweenOrderByDataHoraAsc(
        String contaOrigem, String contaDestino,
        LocalDateTime inicio, LocalDateTime fim);
}
