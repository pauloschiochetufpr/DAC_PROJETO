package com.dac.auth.consumer;

import com.dac.auth.config.RabbitMQConfig;
import com.dac.auth.entity.Usuario;
import com.dac.auth.repository.UsuarioRepository;
import com.dac.auth.service.UsuarioService;
import com.dac.auth.util.DevLog;
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

    // atualizarUsuario | atualiza campos de um usuario existente com os dados recebidos via fila
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

    // removerUsuario | exclui o usuario do banco a partir do CPF recebido via fila
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
