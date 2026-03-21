package com.dac.saga.service;

import com.dac.saga.config.RabbitMQConfig;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class ResetService {

    @Value("${saga.services.cliente}")
    private String clienteUrl;

    @Value("${saga.services.gerente}")
    private String gerenteUrl;

    @Value("${saga.services.conta}")
    private String contaUrl;

    @Value("${saga.services.auth}")
    private String authUrl;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @RabbitListener(queues = RabbitMQConfig.FILA_RESET)
    public void executarReset(String mensagem) {
        System.out.println("Saga: iniciando reset geral...");

        chamarReset("cliente-service", clienteUrl + "/reboot");
        chamarReset("gerente-service", gerenteUrl + "/reboot");
        chamarReset("conta-service",   contaUrl   + "/reboot");
        chamarReset("auth-service",    authUrl    + "/reboot");

        System.out.println("Saga: reset geral concluido.");
    }

    private void chamarReset(String servico, String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

            HttpResponse<String> response = httpClient.send(
                request, HttpResponse.BodyHandlers.ofString()
            );

            System.out.println("Saga: " + servico + " -> " + response.statusCode());
        } catch (Exception e) {
            System.err.println("Saga: erro ao resetar " + servico + ": " + e.getMessage());
        }
    }
}