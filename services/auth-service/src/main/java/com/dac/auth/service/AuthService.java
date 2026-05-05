package com.dac.auth.service;

// DTOs
import com.dac.auth.dto.request.LoginRequestDTO;
import com.dac.auth.dto.response.LoginResponseDTO;
// entidades
import com.dac.auth.entity.Session;
import com.dac.auth.entity.Usuario;
// repositórios
import com.dac.auth.repository.UsuarioRepository;
// Spring
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    // LoginResult | encapsula a resposta pública e o refreshId; o controller usa o refreshId só para setar o cookie
    public record LoginResult(LoginResponseDTO response, String refreshId) {}

    // login | valida credenciais, registra dispositivo, emite JWE e cria sessão de refresh
    public LoginResult login(LoginRequestDTO request, String ip) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(request.getEmail());
        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Usuário não encontrado");
        }

        Usuario usuario = usuarioOpt.get();
        if (!usuario.getSenhaHash().equals(request.getPassword())) {
            throw new RuntimeException("Senha inválida");
        }

        if (request.getDeviceId() == null || request.getDeviceId().isBlank()) {
            throw new RuntimeException("deviceId é obrigatório");
        }
        String deviceId = request.getDeviceId();

        refreshTokenService.registerOrUpdateDevice(
            usuario.getCpf(),
            deviceId,
            request.getDeviceName() != null ? request.getDeviceName() : "unknown",
            ip != null ? ip : "unknown"
        );

        String token;
        try {
            token = jwtService.generateToken(
                usuario.getCpf(),
                usuario.getEmail(),
                usuario.getTipo()
            );
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar token de acesso", e);
        }

        Session session = refreshTokenService.createSession(usuario.getCpf(), deviceId);

        LoginResponseDTO.UsuarioDTO usuarioDTO = new LoginResponseDTO.UsuarioDTO();
        usuarioDTO.setNome(usuario.getNome());
        usuarioDTO.setCpf(usuario.getCpf());
        usuarioDTO.setEmail(usuario.getEmail());

        LoginResponseDTO response = new LoginResponseDTO();
        response.setAccess_token(token);
        response.setToken_tipo("bearer");
        response.setTipo(usuario.getTipo());
        response.setUsuario(usuarioDTO);

        return new LoginResult(response, session.getRefreshId());
    }
}