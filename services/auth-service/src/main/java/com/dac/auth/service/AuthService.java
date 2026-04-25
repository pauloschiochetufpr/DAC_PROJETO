package com.dac.auth.service;

import com.dac.auth.dto.request.LoginRequestDTO;
import com.dac.auth.dto.response.LoginResponseDTO;
import com.dac.auth.entity.Session;
import com.dac.auth.entity.Usuario;
import com.dac.auth.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private RefreshTokenService refreshTokenService;

    public LoginResponseDTO login(LoginRequestDTO request) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(request.getEmail());
        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Usuário não encontrado");
        }

        Usuario usuario = usuarioOpt.get();
        if (!usuario.getSenhaHash().equals(request.getPassword())) {
            throw new RuntimeException("Senha inválida");
        }

        String deviceId = request.getDeviceId() != null
            ? request.getDeviceId()
            : UUID.randomUUID().toString();

        refreshTokenService.registerOrUpdateDevice(
            usuario.getCpf(),
            deviceId,
            request.getDeviceName() != null ? request.getDeviceName() : "unknown",
            request.getIp() != null ? request.getIp() : "unknown"
        );

        String token = jwtService.generateToken(
            usuario.getCpf(),
            usuario.getEmail(),
            usuario.getTipo(),
            deviceId
        );

        // cria a session e pega o refreshId
        Session session = refreshTokenService.createSession(usuario.getCpf(), deviceId);

        LoginResponseDTO.UsuarioDTO usuarioDTO = new LoginResponseDTO.UsuarioDTO();
        usuarioDTO.setNome(usuario.getNome());
        usuarioDTO.setCpf(usuario.getCpf());
        usuarioDTO.setEmail(usuario.getEmail());
        usuarioDTO.setTipo(usuario.getTipo());

        LoginResponseDTO response = new LoginResponseDTO();
        response.setAccess_token(token);
        response.setToken_tipo("bearer");
        response.setTipo(usuario.getTipo().toUpperCase());
        response.setUsuario(usuarioDTO);
        response.setDeviceId(deviceId);
        response.setRefreshToken(session.getRefreshId());

        return response;
    }
}