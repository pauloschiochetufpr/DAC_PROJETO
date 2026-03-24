/*package com.dac.gerente.service;

import com.dac.gerente.dto.request.GerenteInsercao; // tem que corrigir a porra do get e sets 
import com.dac.gerente.dto.response.DadoGerente;
import com.dac.gerente.entity.Gerente;
import com.dac.gerente.entity.TipoGerente;
import com.dac.gerente.repository.GerenteRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class GerenteService {
    
    @Autowired
    private GerenteRepository gerenteRepository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public DadoGerente cadastrar(GerenteInsercao dto) {
        if (gerenteRepository.existsById(dto.getCpf())) {
            throw new RuntimeException("CPF já cadastrado");
        }
        
        if (gerenteRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email já cadastrado");
        }

        Gerente gerente = new Gerente();
        gerente.setCpf(dto.getCpf());
        gerente.setNome(dto.getNome());
        gerente.setEmail(dto.getEmail());
        gerente.setTelefone(dto.getTelefone());

        if ("gerente".equalsIgnoreCase(dto.getTipo())) {
            gerente.setTipo(TipoGerente.GERENTE);
        } else if ("administrador".equalsIgnoreCase(dto.getTipo())) {
            gerente.setTipo(TipoGerente.ADMINISTRADOR);
        } else {
            throw new RuntimeException("Tipo inválido: Use 'gerente' ou 'administrador'");
        }

        gerenteRepository.save(gerente);
    }
}
*/