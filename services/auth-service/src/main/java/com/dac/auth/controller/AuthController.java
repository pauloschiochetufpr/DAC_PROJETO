package com.dac.auth.controller;

import com.dac.auth.dto.request.LoginRequestDTO;
import com.dac.auth.dto.response.LoginResponseDTO;
import com.dac.auth.dto.response.LogoutResponseDTO;
import com.dac.auth.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO request) {
        try {
            LoginResponseDTO response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<LogoutResponseDTO> logout(
            @RequestHeader("Authorization") String token) {

        LogoutResponseDTO response = authService.logout(token);
        return ResponseEntity.ok(response);
    }
}