package com.dac.conta.repository;

import com.dac.conta.entity.MovimentacaoR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MovimentacaoRRepository extends JpaRepository<MovimentacaoR, Long> {

    List<MovimentacaoR> findByContaOrigemOrContaDestinoOrderByDataHoraDesc(
        String contaOrigem, String contaDestino);

    List<MovimentacaoR> findByContaOrigemOrContaDestinoAndDataHoraBetweenOrderByDataHoraDesc(
        String contaOrigem, String contaDestino,
        LocalDateTime inicio, LocalDateTime fim);
}