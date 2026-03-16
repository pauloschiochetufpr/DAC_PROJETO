package com.dac.auth.controller;

import com.dac.auth.dto.request.LoginRequestDTO;
import com.dac.auth.dto.response.LoginResponseDTO;
import com.dac.auth.service.AuthService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public LoginResponseDTO login(@RequestBody LoginRequestDTO request) {
        return authService.login(request);
    }
}