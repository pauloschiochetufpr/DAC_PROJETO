package com.dac.saga.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CompletableFuture;

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
        System.out.println("Saga: iniciando reset paralelo de todos os serviços...");

        List<CompletableFuture<Void>> tarefas = List.of(
            CompletableFuture.runAsync(() -> postReset(authUrl + "/reboot")),
            CompletableFuture.runAsync(() -> postReset(clienteUrl + "/reboot")),
            CompletableFuture.runAsync(() -> postReset(gerenteUrl + "/reboot")),
            CompletableFuture.runAsync(() -> postReset(contaUrl + "/reboot"))
        );

        CompletableFuture.allOf(tarefas.toArray(new CompletableFuture[0])).join();

        System.out.println("Saga: reset de todos os serviços concluído!");
    }

    private void postReset(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(10))
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