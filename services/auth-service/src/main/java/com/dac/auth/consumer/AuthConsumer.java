package com.dac.auth.consumer;

// config RabbitMQ
import com.dac.auth.config.RabbitMQConfig;
// entidades
import com.dac.auth.entity.Usuario;
// repositórios
import com.dac.auth.repository.UsuarioRepository;
// Spring AMQP / RabbitMQ
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@Component
public class AuthConsumer {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String hashIfNeeded(String senha) {
        if (senha == null || senha.isBlank()) return senha;

        // Evita hash duplo quando a senha já vier em formato bcrypt.
        if (senha.matches("^\\$2[aby]\\$.{56}$")) {
            return senha;
        }

        return passwordEncoder.encode(senha);
    }

    // criarUsuario | recebe mensagem do gerente-service ou saga-service e persiste novo usuário
    @RabbitListener(queues = RabbitMQConfig.FILA_AUTH_CRIAR)
    public void criarUsuario(Map<String, String> msg) {
        String cpf   = msg.get("cpf");
        String nome  = msg.get("nome");
        String email = msg.get("email");
        String senha = msg.get("senha");
        String tipo  = msg.get("tipo");
        String status = msg.get("status");
        String activationToken = msg.get("activationToken");
        String activationExpiresAt = msg.get("activationExpiresAt");

        System.out.println("Auth: criando usuario para CPF " + cpf);

        Optional<Usuario> existente = usuarioRepository.findByCpf(cpf);
        if (existente.isPresent()) {
            System.out.println("Auth: usuario com CPF " + cpf + " já existe, ignorando.");
            return;
        }

        Usuario usuario = new Usuario();
        usuario.setCpf(cpf);
        usuario.setNome(nome);
        usuario.setEmail(email);
        usuario.setSenhaHash(hashIfNeeded(senha));
        usuario.setTipo(tipo);

        if (status != null && !status.isBlank()) {
            usuario.setStatus(status);
        } else {
            usuario.setStatus("ATIVO");
        }

        if (activationToken != null && !activationToken.isBlank()) {
            usuario.setActivationTokenHash(sha256Hex(activationToken));
        }

        if (activationExpiresAt != null && !activationExpiresAt.isBlank()) {
            try {
                usuario.setActivationExpiresAt(LocalDateTime.parse(activationExpiresAt));
            } catch (Exception ignored) {
                // ignora data inválida para manter compatibilidade com payloads antigos
            }
        }

        usuarioRepository.save(usuario);
        System.out.println("Auth: usuario criado com sucesso para " + email);
    }

    // atualizarUsuario | atualiza campos de um usuário existente com os dados recebidos via fila
    @RabbitListener(queues = RabbitMQConfig.FILA_AUTH_ATUALIZAR)
    public void atualizarUsuario(Map<String, String> msg) {
        String cpf = msg.get("cpf");

        System.out.println("Auth: atualizando usuario CPF " + cpf);

        Optional<Usuario> opt = usuarioRepository.findByCpf(cpf);
        if (opt.isEmpty()) {
            System.err.println("Auth: usuario com CPF " + cpf + " não encontrado para atualização.");
            return;
        }

        Usuario usuario = opt.get();

        if (msg.containsKey("nome"))  usuario.setNome(msg.get("nome"));
        if (msg.containsKey("email")) usuario.setEmail(msg.get("email"));
        if (msg.containsKey("senha")) usuario.setSenhaHash(hashIfNeeded(msg.get("senha")));

        usuarioRepository.save(usuario);
        System.out.println("Auth: usuario " + cpf + " atualizado.");
    }

    // removerUsuario | exclui o usuário do banco a partir do CPF recebido via fila
    @RabbitListener(queues = RabbitMQConfig.FILA_AUTH_REMOVER)
    public void removerUsuario(Map<String, String> msg) {
        String cpf = msg.get("cpf");

        System.out.println("Auth: removendo usuario CPF " + cpf);

        Optional<Usuario> opt = usuarioRepository.findByCpf(cpf);
        if (opt.isEmpty()) {
            System.err.println("Auth: usuario com CPF " + cpf + " não encontrado para remoção.");
            return;
        }

        usuarioRepository.delete(opt.get());
        System.out.println("Auth: usuario " + cpf + " removido.");
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
