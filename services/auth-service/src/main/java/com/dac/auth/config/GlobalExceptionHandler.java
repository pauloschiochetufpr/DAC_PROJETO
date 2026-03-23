package com.dac.auth.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import com.dac.auth.dto.response.ErrorResponseDTO;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponseDTO> handleRuntimeException(RuntimeException e) {
        String msg = e.getMessage();
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;

        if ("Usuário não encontrado".equals(msg) || "Senha inválida".equals(msg)) {
            status = HttpStatus.UNAUTHORIZED;
        }

        return ResponseEntity.status(status)
            .body(new ErrorResponseDTO(status.value(), msg != null ? msg : "Erro interno"));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorResponseDTO> handleSecurityException(SecurityException e) {
        String msg = e.getMessage();
        HttpStatus status = HttpStatus.UNAUTHORIZED;

        if ("REPLAY_DETECTED".equals(msg) || "DEVICE_BLACKLISTED".equals(msg) || "DEVICE_MISMATCH".equals(msg)) {
            status = HttpStatus.FORBIDDEN;
        }

        return ResponseEntity.status(status)
            .body(new ErrorResponseDTO(status.value(), msg != null ? msg : "Erro de segurança"));
    }
}