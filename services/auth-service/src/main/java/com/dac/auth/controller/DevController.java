package com.dac.auth.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reboot")
public class DevController {

    @Autowired
    private MongoTemplate mongo;

    @PostMapping
    public String resetDatabase() {
        mongo.dropCollection("auth");

        List<Map<String, Object>> usuarios = new ArrayList<>();

        usuarios.add(new HashMap<>(Map.of("cpf","12912861012","email","cli1@bantads.com.br","senhaHash","tads","tipo","cliente")));
        usuarios.add(new HashMap<>(Map.of("cpf","09506382000","email","cli2@bantads.com.br","senhaHash","tads","tipo","cliente")));
        usuarios.add(new HashMap<>(Map.of("cpf","85733854057","email","cli3@bantads.com.br","senhaHash","tads","tipo","cliente")));
        usuarios.add(new HashMap<>(Map.of("cpf","58872160006","email","cli4@bantads.com.br","senhaHash","tads","tipo","cliente")));
        usuarios.add(new HashMap<>(Map.of("cpf","76179646090","email","cli5@bantads.com.br","senhaHash","tads","tipo","cliente")));
        usuarios.add(new HashMap<>(Map.of("cpf","98574307084","email","ger1@bantads.com.br","senhaHash","tads","tipo","gerente")));
        usuarios.add(new HashMap<>(Map.of("cpf","64065268052","email","ger2@bantads.com.br","senhaHash","tads","tipo","gerente")));
        usuarios.add(new HashMap<>(Map.of("cpf","23862179060","email","ger3@bantads.com.br","senhaHash","tads","tipo","gerente")));
        usuarios.add(new HashMap<>(Map.of("cpf","40501740066","email","adm1@bantads.com.br","senhaHash","tads","tipo","administrador")));

        mongo.insert(usuarios, "auth");
        return "Banco auth recriado com mocks";
    }
}