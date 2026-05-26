package com.dac.auth.service;

// DTOs
import com.dac.auth.dto.request.LoginRequestDTO;
import com.dac.auth.dto.request.AtivarContaRequestDTO;
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
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    private static final String STATUS_ATIVO = "ATIVO";
    private static final String STATUS_PENDENTE_ATIVACAO = "PENDENTE_ATIVACAO";

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

        if (STATUS_PENDENTE_ATIVACAO.equalsIgnoreCase(usuario.getStatus())) {
            throw new AuthenticationException("Conta pendente de ativacao");
        }

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

    public void ativarConta(AtivarContaRequestDTO request) {
        if (request == null ||
            request.getToken() == null || request.getToken().isBlank() ||
            request.getSenha() == null || request.getSenha().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token e senha sao obrigatorios");
        }

        if (request.getSenha().length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha deve ter ao menos 6 caracteres");
        }

        String tokenHash = sha256Hex(request.getToken().trim());
        Usuario usuario = usuarioRepository.findByActivationTokenHash(tokenHash)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Token de ativacao invalido"));

        if (!STATUS_PENDENTE_ATIVACAO.equalsIgnoreCase(usuario.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Conta nao esta pendente de ativacao");
        }

        if (usuario.getActivationExpiresAt() == null || usuario.getActivationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token de ativacao expirado");
        }

        usuario.setSenhaHash(passwordEncoder.encode(request.getSenha()));
        usuario.setStatus(STATUS_ATIVO);
        usuario.setActivationUsedAt(LocalDateTime.now());
        usuario.setActivationTokenHash(null);
        usuario.setActivationExpiresAt(null);

        usuarioRepository.save(usuario);
    }

    private String sha256Hex(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar hash do token", e);
        }
    }
}
