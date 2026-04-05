package com.dac.cliente.listener;

import com.dac.cliente.service.DevService;
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
            System.out.println("cliente-service: reboot concluido com sucesso");
        } catch (Exception e) {
            System.err.println("cliente-service: erro no reboot - " + e.getMessage());
            throw e;
        }
    }
}