package com.dac.cliente.service;

import com.dac.cliente.dto.request.AutocadastroRequestDTO;
import com.dac.cliente.entity.Cliente;
import com.dac.cliente.entity.StatusCliente;
import com.dac.cliente.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class ClienteService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Transactional
    public void autocadastrar(AutocadastroRequestDTO request) {
        validarAutocadastro(request);

        String cpf = normalizarDocumento(request.getCpf());
        if (clienteRepository.existsById(cpf)) {
            throw new IllegalStateException("Cliente ja cadastrado ou aguardando aprovacao");
        }

        Cliente cliente = new Cliente();
        cliente.setCpf(cpf);
        cliente.setNome(normalizarTexto(request.getNome()));
        cliente.setEmail(normalizarEmail(request.getEmail()));
        cliente.setTelefone(normalizarTexto(request.getTelefone()));
        cliente.setSalario(request.getSalario());
        cliente.setEndereco(normalizarTexto(request.getEndereco()));
        cliente.setCep(normalizarDocumento(request.getCep()));
        cliente.setCidade(normalizarTexto(request.getCidade()));
        cliente.setEstado(normalizarUf(request.getEstado()));
        cliente.setStatus(StatusCliente.PENDENTE);

        clienteRepository.save(cliente);
    }

    private void validarAutocadastro(AutocadastroRequestDTO request) {
        if (request == null) {
            throw new IllegalArgumentException("Dados do autocadastro sao obrigatorios");
        }
        if (estaVazio(request.getCpf())) {
            throw new IllegalArgumentException("CPF e obrigatorio");
        }
        if (estaVazio(request.getNome())) {
            throw new IllegalArgumentException("Nome e obrigatorio");
        }
        if (estaVazio(request.getEmail())) {
            throw new IllegalArgumentException("Email e obrigatorio");
        }
        if (request.getSalario() == null || request.getSalario() < 0) {
            throw new IllegalArgumentException("Salario invalido");
        }
        if (estaVazio(request.getEndereco())) {
            throw new IllegalArgumentException("Endereco e obrigatorio");
        }
        if (estaVazio(request.getCep())) {
            throw new IllegalArgumentException("CEP e obrigatorio");
        }
        if (estaVazio(request.getCidade())) {
            throw new IllegalArgumentException("Cidade e obrigatoria");
        }
        if (estaVazio(request.getEstado())) {
            throw new IllegalArgumentException("Estado e obrigatorio");
        }

        String cpf = normalizarDocumento(request.getCpf());
        if (cpf.length() != 11) {
            throw new IllegalArgumentException("CPF invalido");
        }

        String cep = normalizarDocumento(request.getCep());
        if (cep.length() != 8) {
            throw new IllegalArgumentException("CEP invalido");
        }

        String email = normalizarEmail(request.getEmail());
        if (!email.contains("@") || email.startsWith("@") || email.endsWith("@")) {
            throw new IllegalArgumentException("Email invalido");
        }

        String estado = normalizarUf(request.getEstado());
        if (estado.length() != 2) {
            throw new IllegalArgumentException("Estado invalido");
        }
    }

    private String normalizarTexto(String valor) {
        return valor == null ? null : valor.trim();
    }

    private String normalizarEmail(String valor) {
        return valor == null ? null : valor.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizarDocumento(String valor) {
        return valor == null ? null : valor.replaceAll("\\D", "");
    }

    private String normalizarUf(String valor) {
        return valor == null ? null : valor.trim().toUpperCase(Locale.ROOT);
    }

    private boolean estaVazio(String valor) {
        return valor == null || valor.trim().isEmpty();
    }
}
