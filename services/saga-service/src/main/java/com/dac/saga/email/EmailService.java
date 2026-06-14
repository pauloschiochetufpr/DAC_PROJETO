package com.dac.saga.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${saga.email.from}")
    private String from;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviar(EmailPayload payload) {
        String assunto = montarAssunto(payload);
        String corpo = montarCorpo(payload);

        System.out.println("email-service: preparando envio"
            + " | tipo=" + safe(payload.getTipo())
            + " | destinatario=" + safe(payload.getDestinatario())
            + " | assunto=" + assunto
            + " | from=" + safe(from));

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(payload.getDestinatario());
        message.setSubject(assunto);
        message.setText(corpo);

        try {
            mailSender.send(message);
            System.out.println("email-service: envio concluido com sucesso"
                + " | tipo=" + safe(payload.getTipo())
                + " | destinatario=" + safe(payload.getDestinatario())
                + " | assunto=" + assunto);
        } catch (Exception e) {
            System.err.println("email-service: falha no envio"
                + " | tipo=" + safe(payload.getTipo())
                + " | destinatario=" + safe(payload.getDestinatario())
                + " | assunto=" + assunto
                + " | erro=" + e.getClass().getSimpleName()
                + ": " + safe(e.getMessage()));
            throw e;
        }
    }

    private String montarAssunto(EmailPayload payload) {
        return switch (safe(payload.getTipo())) {
            case "APROVACAO_CLIENTE" -> "BANTADS - Cadastro aprovado";
            case "REJEICAO_CLIENTE" -> "BANTADS - Cadastro rejeitado";
            case "FALHA_AUTOCADASTRO" -> "BANTADS - Falha no autocadastro";
            default -> "BANTADS - Atualizacao do seu cadastro";
        };
    }

    private String montarCorpo(EmailPayload payload) {
        return switch (safe(payload.getTipo())) {
            case "APROVACAO_CLIENTE" -> corpoAprovacao(payload);
            case "REJEICAO_CLIENTE" -> corpoRejeicao(payload);
            case "FALHA_AUTOCADASTRO" -> corpoFalha(payload);
            default -> "Ocorreu uma atualizacao no seu cadastro no BANTADS.";
        };
    }

    private String corpoAprovacao(EmailPayload payload) {
        return "Ola, " + safe(payload.getNome()) + ".\n\n"
            + "Seu cadastro no BANTADS foi aprovado.\n"
            + "Conta: " + safe(payload.getNumeroConta()) + "\n"
            + "Gerente responsavel: " + safe(payload.getGerenteNome()) + "\n"
            + "Senha temporaria: " + safe(payload.getSenhaTemporaria()) + "\n\n"
            + "Guarde esses dados com cuidado e faca seu primeiro acesso.\n";
    }

    private String corpoRejeicao(EmailPayload payload) {
        return "Ola, " + safe(payload.getNome()) + ".\n\n"
            + "Seu pedido de cadastro no BANTADS foi rejeitado.\n"
            + "Motivo: " + safe(payload.getMotivo()) + "\n";
    }

    private String corpoFalha(EmailPayload payload) {
        return "Ola, " + safe(payload.getNome()) + ".\n\n"
            + "Nao foi possivel concluir seu autocadastro no BANTADS.\n"
            + "Motivo: " + safe(payload.getMotivo()) + "\n"
            + "CPF: " + safe(payload.getCpf()) + "\n";
    }

    private String safe(String valor) {
        return valor == null ? "" : valor;
    }
}
