package com.dac.auth.dto.request;

public class BotLoginRequestDTO {

    // campo "login" conforme padrão do bot
    private String login;

    // campo "senha" conforme padrão do bot
    private String senha;

    public String getLogin() { return login; }
    public void setLogin(String login) { this.login = login; }

    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
}
