package com.dac.cliente.listener;

import com.dac.cliente.service.DevService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class RebootListener {

    @Autowired
    private DevService devService;

    @RabbitListener(queues = "saga.reset")
    public void onReboot(String mensagem) {
        devService.resetComMocks();
        System.out.println("cliente-service: reboot executado via RabbitMQ");
    }
}