package com.dac.conta.controller;

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

    var cud = new ClassPathResource("database/contaCUD.sql");
    var r = new ClassPathResource("database/contaR.sql");

    String sqlCUD = new String(cud.getInputStream().readAllBytes());
    String sqlR = new String(r.getInputStream().readAllBytes());

    jdbc.execute(sqlCUD);
    jdbc.execute(sqlR);

    return "Banco conta (CUD + R) recriado com mocks";
}
}