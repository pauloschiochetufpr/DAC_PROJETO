package com.dac.auth.controller;

import com.dac.auth.dto.request.LoginRequestDTO;
import com.dac.auth.dto.request.RefreshRequestDTO;
import com.dac.auth.dto.request.ValidateRequestDTO;
import com.dac.auth.dto.response.LoginResponseDTO;
import com.dac.auth.dto.response.LogoutResponseDTO;
import com.dac.auth.dto.response.RefreshResponseDTO;
import com.dac.auth.dto.response.ValidateResponseDTO;
import com.dac.auth.entity.Session;
import com.dac.auth.entity.Usuario;
import com.dac.auth.repository.UsuarioRepository;
import com.dac.auth.service.AuthService;
import com.dac.auth.service.JwtService;
import com.dac.auth.service.RefreshTokenService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
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

    @Autowired
    private RefreshTokenService refreshTokenService;

    @Autowired
    private UsuarioRepository usuarioRepository;
@PostMapping("/login")
public ResponseEntity<LoginResponseDTO> login(
        @RequestBody LoginRequestDTO request,
        HttpServletRequest httpRequest,
        HttpServletResponse httpResponse) {

    request.setIp(httpRequest.getRemoteAddr());
    LoginResponseDTO response = authService.login(request);

    // usa o refreshToken que já veio do AuthService
    Cookie refreshCookie = new Cookie("refreshToken", response.getRefreshToken());
    refreshCookie.setHttpOnly(true);
    refreshCookie.setPath("/auth/refresh");
    refreshCookie.setMaxAge(30 * 24 * 60 * 60);
    httpResponse.addCookie(refreshCookie);

    // remove do body — já foi pro cookie
    response.setRefreshToken(null);

    return ResponseEntity.ok(response);
}

    @PostMapping("/validate")
    public ResponseEntity<ValidateResponseDTO> validate(
            @RequestBody ValidateRequestDTO request) {
        try {
            Claims claims = jwtService.validateToken(request.getToken());
            ValidateResponseDTO response = new ValidateResponseDTO(
                claims.getSubject(),
                claims.get("role", String.class),
                claims.get("email", String.class)
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponseDTO> refresh(
            @RequestBody RefreshRequestDTO request,
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {

        if (refreshToken == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            String ip = httpRequest.getRemoteAddr();
            Session newSession = refreshTokenService.rotateSession(
                refreshToken, request.getDeviceId(), ip);

            Usuario usuario = usuarioRepository.findById(newSession.getUserId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

            String newToken = jwtService.generateToken(
                usuario.getCpf(),
                usuario.getEmail(),
                usuario.getTipo(),
                newSession.getDeviceId()
            );

            Cookie refreshCookie = new Cookie("refreshToken", newSession.getRefreshId());
            refreshCookie.setHttpOnly(true);
            refreshCookie.setPath("/auth/refresh");
            refreshCookie.setMaxAge(30 * 24 * 60 * 60);
            httpResponse.addCookie(refreshCookie);

            RefreshResponseDTO response = new RefreshResponseDTO();
            response.setAccess_token(newToken);
            return ResponseEntity.ok(response);

        } catch (SecurityException e) {
            String msg = e.getMessage();
            if ("REPLAY_DETECTED".equals(msg) || 
                "DEVICE_BLACKLISTED".equals(msg) || 
                "DEVICE_MISMATCH".equals(msg)) {
                return ResponseEntity.status(403).build();
            }
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @CookieValue(name = "refreshToken", required = false) String refreshToken,
            HttpServletResponse httpResponse) {

        if (refreshToken != null) {
            refreshTokenService.revokeSession(refreshToken);
        }

        Cookie refreshCookie = new Cookie("refreshToken", "");
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/auth/refresh");
        refreshCookie.setMaxAge(0);
        httpResponse.addCookie(refreshCookie);

        
        LogoutResponseDTO logoutResponse = new LogoutResponseDTO();
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Claims claims = jwtService.validateToken(token);
                String cpf = claims.getSubject();
                Usuario usuario = usuarioRepository.findByCpf(cpf).orElse(null);
                if (usuario != null) {
                    logoutResponse.setCpf(usuario.getCpf());
                    logoutResponse.setNome(usuario.getNome());
                    logoutResponse.setEmail(usuario.getEmail());
                    logoutResponse.setTipo(usuario.getTipo());
                }
            } catch (Exception ignored) {
                // se o token expirar ainda da logout sem problemas
            }
        }
        
        
        return ResponseEntity.ok().build();
    }
}