package com.dac.conta.listener;

import com.dac.conta.service.DevService;
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
        System.out.println("conta-service: reboot executado via RabbitMQ");
    }
}