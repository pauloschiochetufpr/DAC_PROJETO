package com.dac.gerente.controller;

import com.dac.gerente.service.DevService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reboot")
public class DevController {

    @Autowired
    private DevService devService;

    @PostMapping
    public String resetDatabase() {
        devService.resetComMocks();
        return "Banco gerente recriado com mocks";
    }
}