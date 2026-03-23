package com.dac.auth.service;

import com.dac.auth.dto.request.LoginRequestDTO;
import com.dac.auth.dto.response.LoginResponseDTO;
import com.dac.auth.entity.Usuario;
import com.dac.auth.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    public LoginResponseDTO login(LoginRequestDTO request) {

        // 1. autentica
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(request.getEmail());
        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Usuário não encontrado");
        }

        Usuario usuario = usuarioOpt.get();
        if (!usuario.getSenhaHash().equals(request.getPassword())) {
            throw new RuntimeException("Senha inválida");
        }

        // 2. gera o token
        String token = jwtService.generateToken(
            usuario.getCpf(),
            usuario.getEmail(),
            usuario.getTipo()
        );

        // 3. monta o objeto usuario
        LoginResponseDTO.UsuarioDTO usuarioDTO = new LoginResponseDTO.UsuarioDTO();
        usuarioDTO.setCpf(usuario.getCpf());
        usuarioDTO.setEmail(usuario.getEmail());
        usuarioDTO.setTipo(usuario.getTipo());

        // 4. monta a resposta no formato da spec
        LoginResponseDTO response = new LoginResponseDTO();
        response.setAccess_token(token);
        response.setToken_tipo("bearer");
        response.setTipo(usuario.getTipo().toUpperCase());
        response.setUsuario(usuarioDTO);

        return response;
    }
}