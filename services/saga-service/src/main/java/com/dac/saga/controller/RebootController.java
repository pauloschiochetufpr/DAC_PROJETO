package com.dac.saga.controller;

import com.dac.saga.service.ResetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RebootController {

    private final ResetService resetService;

    public RebootController(ResetService resetService) {
        this.resetService = resetService;
    }

    @PostMapping("/reboot")
    public ResponseEntity<Map<String, String>> reboot() {
        try {
            resetService.solicitarResetOrquestrado();
            return ResponseEntity.accepted().body(Map.of(
                "status", "accepted",
                "message", "Solicitacao de reset enviada para a Saga via RabbitMQ"
            ));
        } catch (IllegalStateException | UnsupportedOperationException ex) {
            return ResponseEntity.status(501).body(Map.of(
                "status", "error",
                "errorCode", "RESET_ORQUESTRACAO_INDISPONIVEL",
                "message", ex.getMessage()
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "errorCode", "RESET_REQUISICAO_INVALIDA",
                "message", ex.getMessage()
            ));
        }
    }
}
