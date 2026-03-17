package com.dac.auth.service;

import com.dac.auth.dto.request.LoginRequestDTO;
import com.dac.auth.dto.response.LoginResponseDTO;
import com.dac.auth.dto.response.LogoutResponseDTO;
import com.dac.auth.entity.Usuario;
import com.dac.auth.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public LoginResponseDTO login(LoginRequestDTO request) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(request.getEmail());
        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Usuário não encontrado");
        }

        Usuario usuario = usuarioOpt.get();
        if (!usuario.getSenhaHash().equals(request.getPassword())) {
            throw new RuntimeException("Senha inválida");
        }

        LoginResponseDTO response = new LoginResponseDTO();
        response.setCpf(usuario.getCpf());
        response.setEmail(usuario.getEmail());
        response.setTipo(usuario.getTipo());
        
        return response;
    }

    public LogoutResponseDTO logout(String token) {
        String cpf = token.replace("Bearer ", "");
        Optional<Usuario> usuarioOpt = usuarioRepository.findByCpf(cpf);
        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Usuário não encontrado");
        }

        Usuario usuario = usuarioOpt.get();

        LogoutResponseDTO response = new LogoutResponseDTO();
        response.setCpf(usuario.getCpf());
        response.setNome(usuario.getNome());
        response.setEmail(usuario.getEmail());
        response.setTipo(usuario.getTipo());
        
        return response;
    }
}