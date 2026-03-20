package com.dac.gerente.service;

import com.dac.gerente.entity.Gerente;
import com.dac.gerente.entity.TipoGerente;
import com.dac.gerente.repository.GerenteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DevService {

    @Autowired
    private GerenteRepository gerenteRepository;

    @Transactional
    public void resetComMocks() {
        gerenteRepository.deleteAll();
        gerenteRepository.saveAll(mocks());
    }

    private List<Gerente> mocks() {
        return List.of(
            gerente("98574307084", "Geniéve",    "ger1@bantads.com.br", TipoGerente.GERENTE),
            gerente("64065268052", "Godophredo",  "ger2@bantads.com.br", TipoGerente.GERENTE),
            gerente("23862179060", "Gyândula",    "ger3@bantads.com.br", TipoGerente.GERENTE),
            gerente("40501740066", "Adamântio",   "adm1@bantads.com.br", TipoGerente.ADMINISTRADOR)
        );
    }

    private Gerente gerente(String cpf, String nome, String email, TipoGerente tipo) {
        Gerente g = new Gerente();
        g.setCpf(cpf);
        g.setNome(nome);
        g.setEmail(email);
        g.setTipo(tipo);
        return g;
    }
}