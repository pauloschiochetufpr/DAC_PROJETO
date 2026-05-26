package com.dac.saga.service;

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

    public void solicitarResetOrquestrado() {
        System.out.println("Saga: iniciando reset síncrono de todos os serviços...");

        postReset(authUrl + "/reboot");
        postReset(clienteUrl + "/reboot");
        postReset(gerenteUrl + "/reboot");
        postReset(contaUrl + "/reboot");

        System.out.println("Saga: reset de todos os serviços concluído!");
    }

    private void postReset(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("Saga reset: POST " + url + " -> Status " + response.statusCode());
            if (response.statusCode() >= 400) {
                throw new RuntimeException("HTTP status " + response.statusCode());
            }
        } catch (Exception e) {
            System.err.println("Saga reset: falha ao resetar " + url + " - " + e.getMessage());
            throw new RuntimeException("Falha no reset do serviço: " + url, e);
        }
    }
}