package com.dac.auth.service;

// DTOs
import com.dac.auth.dto.request.LoginRequestDTO;
import com.dac.auth.dto.response.LoginResponseDTO;
// entidades
import com.dac.auth.entity.Session;
import com.dac.auth.entity.Usuario;
// exceções
import com.dac.auth.exception.AuthenticationException;
import com.dac.auth.exception.BadRequestException;
// repositórios
import com.dac.auth.repository.UsuarioRepository;
// Spring
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
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

    @Autowired
    private PasswordEncoder passwordEncoder;

    // encapsula a resposta pública e o refreshId.  controller usa o refreshId só para setar o cookie
    public record LoginResult(LoginResponseDTO response, String refreshId) {}

    //valida credenciais, registra dispositivo, emite JWE e cria sessão de refresh
    public LoginResult login(LoginRequestDTO request, String ip) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(request.getEmail());
        if (usuarioOpt.isEmpty()) {
            throw new AuthenticationException("Usuário/Senha incorretos");
        }

        Usuario usuario = usuarioOpt.get();
        String senhaPersistida = usuario.getSenhaHash();
        String senhaInformada = request.getPassword();
        boolean senhaValida = false;

        if (senhaPersistida != null && senhaInformada != null) {
            if (passwordEncoder.matches(senhaInformada, senhaPersistida)) {
                senhaValida = true;
            } else if (senhaPersistida.equals(senhaInformada)) {
                // Migra senha legado em texto puro para bcrypt no primeiro login válido.
                usuario.setSenhaHash(passwordEncoder.encode(senhaInformada));
                usuarioRepository.save(usuario);
                senhaValida = true;
            }
        }

        if (!senhaValida) {
            throw new AuthenticationException("Usuário/Senha incorretos");
        }

        if (request.getDeviceId() == null || request.getDeviceId().isBlank()) {
            throw new BadRequestException("deviceId é obrigatório");
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
