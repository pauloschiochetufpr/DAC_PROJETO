package com.dac.auth.repository;

// Spring Data / MongoDB
import org.springframework.data.mongodb.repository.MongoRepository;

import com.dac.auth.entity.Usuario;

import java.util.Optional;

public interface UsuarioRepository extends MongoRepository<Usuario, String> {

    // findByEmail | busca usuário pelo e-mail para autenticação
    Optional<Usuario> findByEmail(String email);

    // findByCpf | busca usuário pelo CPF para atualização ou remoção
    Optional<Usuario> findByCpf(String cpf);

}
