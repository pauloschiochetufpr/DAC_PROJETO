package com.dac.auth.service;

// entidades
import com.dac.auth.entity.Usuario;
// repositórios
import com.dac.auth.repository.UsuarioRepository;
// util
import com.dac.auth.util.DevLog;
// Spring
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

// UsuarioService | lógica compartilhada de criação/hash de usuário,
// usada tanto pelo consumer RabbitMQ (assíncrono) quanto pelo endpoint interno (síncrono)
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // hashIfNeeded | aplica BCrypt, evitando hash duplo quando a senha já vier em formato bcrypt
    public String hashIfNeeded(String senha) {
        if (senha == null || senha.isBlank()) return senha;
        if (senha.matches("^\\$2[aby]\\$.{56}$")) {
            return senha;
        }
        return passwordEncoder.encode(senha);
    }

    // criarUsuario | cria o usuário de forma idempotente; retorna true se criou, false se já existia
    public boolean criarUsuario(String cpf, String nome, String email, String senha, String tipo) {
        if (cpf == null || cpf.isBlank()) return false;

        Optional<Usuario> existente = usuarioRepository.findByCpf(cpf);
        if (existente.isPresent()) {
            DevLog.log("criarUsuario ignorado - CPF ja existe: " + cpf);
            return false;
        }

        Usuario usuario = new Usuario();
        usuario.setCpf(cpf);
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setSenhaHash(hashIfNeeded(senha));
        usuario.setTipo(tipo);

        usuarioRepository.save(usuario);
        DevLog.log("criarUsuario OK - email: " + email + ", CPF: " + cpf);
        return true;
    }

    // removerUsuario | remove o usuário pelo CPF; ação compensatória usada pelas sagas.
    // Retorna true se removeu, false se não existia.
    public boolean removerUsuario(String cpf) {
        if (cpf == null || cpf.isBlank()) return false;

        Optional<Usuario> existente = usuarioRepository.findByCpf(cpf);
        if (existente.isEmpty()) {
            return false;
        }

        usuarioRepository.delete(existente.get());
        DevLog.log("removerUsuario OK (compensação) - CPF: " + cpf);
        return true;
    }
}
