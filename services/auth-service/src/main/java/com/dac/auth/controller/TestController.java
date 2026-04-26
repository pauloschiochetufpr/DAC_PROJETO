package com.dac.auth.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    // test | endpoint de smoke test para verificar que o serviço subiu corretamente
    @GetMapping("/test")
    public String test() {
        return "Auth service running";
    }
}