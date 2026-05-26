package com.dac.auth.entity;

// Spring Data / MongoDB
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

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

    // status da conta para fluxo de ativacao
    // valores esperados: "ATIVO" | "PENDENTE_ATIVACAO"
    private String status;

    // hash do token de ativacao (token puro nao deve ser persistido)
    private String activationTokenHash;

    // expiracao do token de ativacao
    private LocalDateTime activationExpiresAt;

    // data/hora do uso do token
    private LocalDateTime activationUsedAt;

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getActivationTokenHash() {
        return activationTokenHash;
    }

    public void setActivationTokenHash(String activationTokenHash) {
        this.activationTokenHash = activationTokenHash;
    }

    public LocalDateTime getActivationExpiresAt() {
        return activationExpiresAt;
    }

    public void setActivationExpiresAt(LocalDateTime activationExpiresAt) {
        this.activationExpiresAt = activationExpiresAt;
    }

    public LocalDateTime getActivationUsedAt() {
        return activationUsedAt;
    }

    public void setActivationUsedAt(LocalDateTime activationUsedAt) {
        this.activationUsedAt = activationUsedAt;
    }
}
