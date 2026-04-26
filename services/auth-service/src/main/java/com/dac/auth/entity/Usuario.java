package com.dac.auth.entity;

// Spring Data / MongoDB
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "auth")
public class Usuario {

    @Id
    private String id;

    private String cpf;

    private String nome;

    private String email;

    // senha armazenada como hash; migrar para bcrypt futuramente
    private String senhaHash;

    // "cliente", "gerente" ou "administrador"
    private String tipo;

    public String getCpf() {
        return cpf;
    }

    public void setCpf(String cpf) {
        this.cpf = cpf;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public void setSenhaHash(String senhaHash) {
        this.senhaHash = senhaHash;
    }

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }
}
