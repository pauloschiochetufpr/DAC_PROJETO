package com.dac.cliente.service;

import com.dac.cliente.entity.Cliente;
import com.dac.cliente.entity.StatusCliente;
import com.dac.cliente.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DevService {

    @Autowired
    private ClienteRepository clienteRepository;

    @Transactional
    public void resetComMocks() {
        clienteRepository.deleteAll();
        clienteRepository.saveAll(mocks());
    }

    private List<Cliente> mocks() {
        return List.of(
            cliente("12912861012", "Catharyna",   "cli1@bantads.com.br", 10000.0, "Curitiba", "PR", StatusCliente.APROVADO),
            cliente("09506382000", "Cleuddônio",  "cli2@bantads.com.br", 20000.0, "Curitiba", "PR", StatusCliente.APROVADO),
            cliente("85733854057", "Catianna",    "cli3@bantads.com.br",  3000.0, "Curitiba", "PR", StatusCliente.APROVADO),
            cliente("58872160006", "Cutardo",     "cli4@bantads.com.br",   500.0, "Curitiba", "PR", StatusCliente.APROVADO),
            cliente("76179646090", "Coândrya",    "cli5@bantads.com.br",  1500.0, "Curitiba", "PR", StatusCliente.APROVADO)
        );
    }

    private Cliente cliente(String cpf, String nome, String email,
                            Double salario, String cidade, String estado,
                            StatusCliente status) {
        Cliente c = new Cliente();
        c.setCpf(cpf);
        c.setNome(nome);
        c.setEmail(email);
        c.setSalario(salario);
        c.setCidade(cidade);
        c.setEstado(estado);
        c.setStatus(status);
        return c;
    }
}