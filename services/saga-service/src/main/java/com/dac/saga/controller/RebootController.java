package com.dac.saga.controller;

import com.dac.saga.service.ResetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RebootController {

    private final ResetService resetService;

    public RebootController(ResetService resetService) {
        this.resetService = resetService;
    }

    @RequestMapping(value = "/reboot", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, String>> reboot() {
        try {
            resetService.solicitarResetOrquestrado();
            return ResponseEntity.ok().body(Map.of(
                "status", "accepted",
                "message", "Reset iniciado — todos os bancos serao recriados com os dados mock"
            ));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", "Falha ao publicar solicitacao de reset: " + ex.getMessage()
            ));
        }
    }
}