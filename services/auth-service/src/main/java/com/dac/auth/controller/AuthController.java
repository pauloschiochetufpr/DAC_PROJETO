package com.dac.auth.controller;

import com.dac.auth.dto.request.LoginRequestDTO;
import com.dac.auth.dto.request.ValidateRequestDTO;
import com.dac.auth.dto.response.LoginResponseDTO;
import com.dac.auth.dto.response.ValidateResponseDTO;
import com.dac.auth.service.AuthService;
import com.dac.auth.service.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@RequestBody LoginRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/validate")
    public ResponseEntity<ValidateResponseDTO> validate(@RequestBody ValidateRequestDTO request) {
        try {
            Claims claims = jwtService.validateToken(request.getToken());

            ValidateResponseDTO response = new ValidateResponseDTO(
                claims.getSubject(),                  // cpf → userId
                claims.get("role", String.class),     // role
                claims.get("email", String.class)
            );

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }
}