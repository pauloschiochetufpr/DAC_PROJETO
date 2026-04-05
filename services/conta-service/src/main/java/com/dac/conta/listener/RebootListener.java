package com.dac.conta.listener;

import com.dac.conta.service.DevService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class RebootListener {

    @Autowired
    private DevService devService;

    @RabbitListener(queues = "${rabbitmq.fila.reset:saga.reset}",
                    containerFactory = "rabbitListenerContainerFactory")
    public void onReboot(String mensagem) {
        try {
            devService.resetComMocks();
            System.out.println("conta-service: reboot concluido com sucesso");
        } catch (Exception e) {
            System.err.println("conta-service: erro no reboot - " + e.getMessage());
            throw e;
        }
    }
}