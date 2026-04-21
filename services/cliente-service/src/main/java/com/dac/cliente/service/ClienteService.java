package com.dac.cliente.service;

import com.dac.cliente.dto.request.*;
import com.dac.cliente.dto.response.*;
import com.dac.cliente.entity.Cliente;
import com.dac.cliente.entity.StatusCliente;
import com.dac.cliente.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository repository;

    public void autocadastro(AutocadastroRequestDTO dto) {

        validarAutocadastro(dto);

        String cpf = normalizarDocumento(dto.getCpf());

        if (repository.existsById(cpf)) {
            throw new RuntimeException("Cliente já existe ou está pendente");
        }

        Cliente c = new Cliente();
        c.setCpf(cpf);
        c.setNome(normalizarTexto(dto.getNome()));
        c.setEmail(normalizarEmail(dto.getEmail()));
        c.setTelefone(normalizarTexto(dto.getTelefone()));
        c.setSalario(dto.getSalario());
        c.setEndereco(normalizarTexto(dto.getEndereco()));
        c.setCep(normalizarDocumento(dto.getCep()));
        c.setCidade(normalizarTexto(dto.getCidade()));
        c.setEstado(normalizarUf(dto.getEstado()));
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

        c.setNome(normalizarTexto(dto.getNome()));
        c.setEmail(normalizarEmail(dto.getEmail()));
        c.setSalario(dto.getSalario());
        c.setEndereco(normalizarTexto(dto.getEndereco()));
        c.setCep(normalizarDocumento(dto.getCep()));
        c.setCidade(normalizarTexto(dto.getCidade()));
        c.setEstado(normalizarUf(dto.getEstado()));

        repository.save(c);
    }

    public void aprovar(String cpf) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        c.setStatus(StatusCliente.APROVADO);

        repository.save(c);
    }

    public void rejeitar(String cpf, String motivo) {
        Cliente c = repository.findById(cpf)
                .orElseThrow(() -> new RuntimeException("Cliente não encontrado"));

        c.setStatus(StatusCliente.REJEITADO);
        c.setMotivoRejeicao(motivo);

        repository.save(c);
    }

    // ================= VALIDAÇÕES =================

    private void validarAutocadastro(AutocadastroRequestDTO dto) {

        if (dto == null) throw new IllegalArgumentException("Dados obrigatórios");

        if (estaVazio(dto.getCpf())) throw new IllegalArgumentException("CPF obrigatório");
        if (estaVazio(dto.getNome())) throw new IllegalArgumentException("Nome obrigatório");
        if (estaVazio(dto.getEmail())) throw new IllegalArgumentException("Email obrigatório");
        if (dto.getSalario() == null || dto.getSalario() < 0)
            throw new IllegalArgumentException("Salário inválido");
        if (estaVazio(dto.getEndereco())) throw new IllegalArgumentException("Endereço obrigatório");
        if (estaVazio(dto.getCep())) throw new IllegalArgumentException("CEP obrigatório");
        if (estaVazio(dto.getCidade())) throw new IllegalArgumentException("Cidade obrigatória");
        if (estaVazio(dto.getEstado())) throw new IllegalArgumentException("Estado obrigatório");

        String cpf = normalizarDocumento(dto.getCpf());
        if (cpf.length() != 11) throw new IllegalArgumentException("CPF inválido");

        String cep = normalizarDocumento(dto.getCep());
        if (cep.length() != 8) throw new IllegalArgumentException("CEP inválido");

        String email = normalizarEmail(dto.getEmail());
        if (!email.contains("@") || email.startsWith("@") || email.endsWith("@"))
            throw new IllegalArgumentException("Email inválido");

        String estado = normalizarUf(dto.getEstado());
        if (estado.length() != 2) throw new IllegalArgumentException("UF inválida");
    }

    // ================= NORMALIZAÇÃO =================

    private String normalizarTexto(String v) {
        return v == null ? null : v.trim();
    }

    private String normalizarEmail(String v) {
        return v == null ? null : v.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizarDocumento(String v) {
        return v == null ? null : v.replaceAll("\\D", "");
    }

    private String normalizarUf(String v) {
        return v == null ? null : v.trim().toUpperCase(Locale.ROOT);
    }

    private boolean estaVazio(String v) {
        return v == null || v.trim().isEmpty();
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