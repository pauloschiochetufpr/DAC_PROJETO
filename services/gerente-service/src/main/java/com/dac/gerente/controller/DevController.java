package com.dac.gerente.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/dev")
public class DevController {

    @Autowired
    private JdbcTemplate jdbc;

    @PostMapping("/reset")
    public String resetDatabase() throws Exception {

        var resource = new ClassPathResource("database/gerente.sql");
        String sql = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        jdbc.execute(sql);

        return "Banco gerente recriado com mocks";
    }
}