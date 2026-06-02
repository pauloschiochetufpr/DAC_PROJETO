package com.dac.conta.controller;

import com.dac.conta.service.DevService;
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
        return "Banco conta recriado com mocks";
    }
}