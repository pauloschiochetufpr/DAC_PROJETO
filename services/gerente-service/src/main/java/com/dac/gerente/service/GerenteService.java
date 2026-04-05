package com.dac.gerente.service;

import com.dac.gerente.dto.request.GerenteAtt;
import com.dac.gerente.dto.request.GerenteInsercao;
import com.dac.gerente.dto.response.DadoGerente;
import com.dac.gerente.entity.Gerente;
import com.dac.gerente.entity.TipoGerente;
import com.dac.gerente.repository.GerenteRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GerenteService {

    @Autowired
    private GerenteRepository gerenteRepository;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    public List<DadoGerente> listarTodos() {
        return gerenteRepository.findAllByOrderByNomeAsc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
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

        Map<String, String> authEvent = new HashMap<>();
        authEvent.put("acao", "criar");
        authEvent.put("cpf", dto.getCpf());
        authEvent.put("nome", dto.getNome());
        authEvent.put("email", dto.getEmail());
        authEvent.put("senha", dto.getSenha());
        authEvent.put("tipo", dto.getTipo().toLowerCase());

        try {
            rabbitTemplate.convertAndSend("auth.exchange", "auth.criar", authEvent);
        } catch (Exception e) {
            System.err.println("Aviso: não foi possível publicar evento no RabbitMQ: " + e.getMessage());
        }

        // p/fazer redistribuiçao de contas r17

        return toDTO(gerente);
    }

    public DadoGerente consultarPorCpf(String cpf) {
        Gerente gerente = gerenteRepository.findById(cpf)
                .orElseThrow(() -> new RuntimeException("Gerente não encontrado"));
        return toDTO(gerente);
    }

    @Transactional
    public DadoGerente atualizar(String cpf, GerenteAtt dto) {
        Gerente gerente = gerenteRepository.findById(cpf)
                .orElseThrow(() -> new RuntimeException("Gerente não encontrado"));

        if (dto.getNome() != null) {
            gerente.setNome(dto.getNome());
        }
        if (dto.getEmail() != null) {
            Optional<Gerente> existente = gerenteRepository.findAll().stream()
                    .filter(g -> g.getEmail().equals(dto.getEmail()) && !g.getCpf().equals(cpf))
                    .findFirst();
            if (existente.isPresent()) {
                throw new RuntimeException("Email já cadastrado por outro gerente");
            }
            gerente.setEmail(dto.getEmail());
        }
        if (dto.getTelefone() != null) {
            gerente.setTelefone(dto.getTelefone());
        }

        gerenteRepository.save(gerente);

        Map<String, String> authEvent = new HashMap<>();
        authEvent.put("acao", "atualizar");
        authEvent.put("cpf", cpf);
        if (dto.getNome() != null) authEvent.put("nome", dto.getNome());
        if (dto.getEmail() != null) authEvent.put("email", dto.getEmail());
        if (dto.getSenha() != null) authEvent.put("senha", dto.getSenha());

        try {
            rabbitTemplate.convertAndSend("auth.exchange", "auth.atualizar", authEvent);
        } catch (Exception e) {
            System.err.println("Aviso: não foi possível publicar evento no RabbitMQ: " + e.getMessage());
        }

        return toDTO(gerente);
    }

    @Transactional
    public DadoGerente remover(String cpf) {
        Gerente gerente = gerenteRepository.findById(cpf)
                .orElseThrow(() -> new RuntimeException("Gerente não encontrado"));

        long totalGerentes = gerenteRepository.count();
        if (totalGerentes <= 1) {
            throw new RuntimeException("Não é permitido remover o último gerente do banco");
        }

        gerenteRepository.delete(gerente);

        Map<String, String> authEvent = new HashMap<>();
        authEvent.put("acao", "remover");
        authEvent.put("cpf", cpf);

        try {
            rabbitTemplate.convertAndSend("auth.exchange", "auth.remover", authEvent);
        } catch (Exception e) {
            System.err.println("Aviso: não foi possível publicar evento no RabbitMQ: " + e.getMessage());
        }

        // p/fazer redistribuicao de contas r18

        return toDTO(gerente);
    }

    private DadoGerente toDTO(Gerente gerente) {
        return new DadoGerente(
                gerente.getCpf(),
                gerente.getNome(),
                gerente.getEmail(),
                gerente.getTelefone(),
                gerente.getTipo() != null ? gerente.getTipo().name() : null
        );
    }
}