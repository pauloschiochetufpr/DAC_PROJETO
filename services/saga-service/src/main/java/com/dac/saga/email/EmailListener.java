package com.dac.saga.email;

import com.dac.saga.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class EmailListener {

    private final EmailService emailService;

    public EmailListener(EmailService emailService) {
        this.emailService = emailService;
    }

    @RabbitListener(queues = RabbitMQConfig.FILA_EMAIL_SEND)
    public void enviarEmail(EmailPayload payload) {
        emailService.enviar(payload);
    }
}
