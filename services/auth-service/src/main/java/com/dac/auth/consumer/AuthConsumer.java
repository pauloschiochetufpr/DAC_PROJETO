package com.dac.auth.consumer;

import com.dac.auth.config.RabbitMQConfig;
import com.dac.auth.entity.Usuario;
import com.dac.auth.repository.UsuarioRepository;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

@Component
public class AuthConsumer {

    @Autowired
    private UsuarioRepository usuarioRepository;

    // criar usuario = gerente-service ou saga-service)
    // cpf -> nome -> email -> senha -> tipo }
    @RabbitListener(queues = RabbitMQConfig.FILA_AUTH_CRIAR)
    public void criarUsuario(Map<String, String> msg) {
        String cpf   = msg.get("cpf");
        String nome  = msg.get("nome");
        String email = msg.get("email");
        String senha = msg.get("senha");
        String tipo  = msg.get("tipo");

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
        usuario.setSenhaHash(senha); // precisa do hash com bcrypt 
        usuario.setTipo(tipo);

        usuarioRepository.save(usuario);
        System.out.println("Auth: usuario criado com sucesso para " + email);
    }

    // atualizar usuario = ver se vem gerente-service POREM PRECISA VER PRO CLIENTE TAMBÉM
    // mensagem = cpf -> nome? -> email? -> senha?
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
        if (msg.containsKey("senha")) usuario.setSenhaHash(msg.get("senha")); // precisa do hash

        usuarioRepository.save(usuario);
        System.out.println("Auth: usuario " + cpf + " atualizado.");
    }

    // remover user  (gerente-service)
    // mensagem = cpf
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
}