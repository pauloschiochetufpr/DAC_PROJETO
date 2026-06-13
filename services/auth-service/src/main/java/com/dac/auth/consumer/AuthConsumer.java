package com.dac.auth.consumer;

// config RabbitMQ
import com.dac.auth.config.RabbitMQConfig;
// entidades
import com.dac.auth.entity.Usuario;
// repositórios
import com.dac.auth.repository.UsuarioRepository;
// service
import com.dac.auth.service.UsuarioService;
// util
import com.dac.auth.util.DevLog;
// Spring AMQP / RabbitMQ
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

@Component
public class AuthConsumer {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private UsuarioService usuarioService;

    // criarUsuario | recebe mensagem do gerente-service ou saga-service e persiste novo usuário.
    // Delega ao UsuarioService (idempotente) — o mesmo usado pelo endpoint interno síncrono.
    @RabbitListener(queues = RabbitMQConfig.FILA_AUTH_CRIAR)
    public void criarUsuario(Map<String, String> msg) {
        DevLog.log("criarUsuario - recebido CPF: " + msg.get("cpf") + ", email: " + msg.get("email") + ", tipo: " + msg.get("tipo"));
        usuarioService.criarUsuario(
            msg.get("cpf"),
            msg.get("nome"),
            msg.get("email"),
            msg.get("senha"),
            msg.get("tipo")
        );
    }

    // atualizarUsuario | atualiza campos de um usuário existente com os dados recebidos via fila
    @RabbitListener(queues = RabbitMQConfig.FILA_AUTH_ATUALIZAR)
    public void atualizarUsuario(Map<String, String> msg) {
        String cpf = msg.get("cpf");

        DevLog.log("atualizarUsuario - recebido CPF: " + cpf);

        Optional<Usuario> opt = usuarioRepository.findByCpf(cpf);
        if (opt.isEmpty()) {
            DevLog.log("atualizarUsuario falhou - CPF nao encontrado: " + cpf);
            return;
        }

        Usuario usuario = opt.get();

        if (msg.containsKey("nome"))  usuario.setNome(msg.get("nome"));
        if (msg.containsKey("email")) usuario.setEmail(msg.get("email"));
        if (msg.containsKey("senha")) usuario.setSenhaHash(usuarioService.hashIfNeeded(msg.get("senha")));

        usuarioRepository.save(usuario);
        DevLog.log("atualizarUsuario OK - CPF: " + cpf);
    }

    // removerUsuario | exclui o usuário do banco a partir do CPF recebido via fila
    @RabbitListener(queues = RabbitMQConfig.FILA_AUTH_REMOVER)
    public void removerUsuario(Map<String, String> msg) {
        String cpf = msg.get("cpf");

        DevLog.log("removerUsuario - recebido CPF: " + cpf);

        Optional<Usuario> opt = usuarioRepository.findByCpf(cpf);
        if (opt.isEmpty()) {
            DevLog.log("removerUsuario falhou - CPF nao encontrado: " + cpf);
            return;
        }

        usuarioRepository.delete(opt.get());
        DevLog.log("removerUsuario OK - CPF: " + cpf);
    }
}
