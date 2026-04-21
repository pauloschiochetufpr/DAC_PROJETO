package com.dac.cliente.service;

import com.dac.cliente.dto.request.*;
import com.dac.cliente.dto.response.*;
import com.dac.cliente.entity.Cliente;
import com.dac.cliente.entity.StatusCliente;
import com.dac.cliente.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository repository;

    public void autocadastro(AutocadastroRequestDTO dto) {

        if (repository.existsById(dto.getCpf())) {
            throw new RuntimeException("Cliente já existe");
        }

        Cliente c = new Cliente();
        c.setCpf(dto.getCpf());
        c.setNome(dto.getNome());
        c.setEmail(dto.getEmail());
        c.setTelefone(dto.getTelefone());
        c.setSalario(dto.getSalario());
        c.setEndereco(dto.getEndereco());
        c.setCep(dto.getCep());
        c.setCidade(dto.getCidade());
        c.setEstado(dto.getEstado());

        // ✅ agora usando ENUM
        c.setStatus(StatusCliente.PENDENTE);

        repository.save(c);
    }

    public List<ClienteParaAprovarResponseDTO> listarParaAprovar() {
        return repository.findByStatus(StatusCliente.PENDENTE)
                .stream()
                .map(this::toParaAprovarDTO)
                .collect(Collectors.toList());
    }

    public ClienteResponseDTO buscarPorCpf(String cpf) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        return toClienteResponse(c);
    }

    public DadosClienteResponseDTO buscarDadosCompletos(String cpf) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        return toDadosDTO(c);
    }

    public void atualizarPerfil(String cpf, PerfilRequestDTO dto) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        c.setNome(dto.getNome());
        c.setEmail(dto.getEmail());
        c.setSalario(dto.getSalario());
        c.setEndereco(dto.getEndereco());
        c.setCep(dto.getCep());
        c.setCidade(dto.getCidade());
        c.setEstado(dto.getEstado());

        repository.save(c);
    }

    public void aprovar(String cpf) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        // ✅ ENUM
        c.setStatus(StatusCliente.APROVADO);

        repository.save(c);
    }

    public void rejeitar(String cpf, String motivo) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        // ✅ ENUM
        c.setStatus(StatusCliente.REJEITADO);
        c.setMotivoRejeicao(motivo);

        repository.save(c);
    }

    // ================= DTO MAPPERS =================

    private ClienteParaAprovarResponseDTO toParaAprovarDTO(Cliente c) {
        ClienteParaAprovarResponseDTO dto = new ClienteParaAprovarResponseDTO();
        dto.setCpf(c.getCpf());
        dto.setNome(c.getNome());
        dto.setEmail(c.getEmail());
        dto.setSalario(c.getSalario());
        dto.setEndereco(c.getEndereco());
        dto.setCidade(c.getCidade());
        dto.setEstado(c.getEstado());
        return dto;
    }

    private ClienteResponseDTO toClienteResponse(Cliente c) {
        ClienteResponseDTO dto = new ClienteResponseDTO();
        dto.setCpf(c.getCpf());
        dto.setNome(c.getNome());
        dto.setEmail(c.getEmail());
        dto.setTelefone(c.getTelefone());
        dto.setEndereco(c.getEndereco());
        dto.setCidade(c.getCidade());
        dto.setEstado(c.getEstado());

        dto.setConta(null);
        dto.setSaldo(null);
        dto.setLimite(null);

        return dto;
    }

    private DadosClienteResponseDTO toDadosDTO(Cliente c) {
        DadosClienteResponseDTO dto = new DadosClienteResponseDTO();

        dto.setCpf(c.getCpf());
        dto.setNome(c.getNome());
        dto.setTelefone(c.getTelefone());
        dto.setEmail(c.getEmail());
        dto.setEndereco(c.getEndereco());
        dto.setCep(c.getCep());
        dto.setCidade(c.getCidade());
        dto.setEstado(c.getEstado());
        dto.setSalario(c.getSalario());

        dto.setConta(null);
        dto.setSaldo(null);
        dto.setLimite(null);

        dto.setGerente(null);
        dto.setGerente_nome(null);
        dto.setGerente_email(null);

        return dto;
    }
}