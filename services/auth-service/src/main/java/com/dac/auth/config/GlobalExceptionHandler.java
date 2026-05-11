package com.dac.auth.config;

import com.dac.auth.dto.response.ErrorResponseDTO;
import com.dac.auth.exception.AuthenticationException;
import com.dac.auth.exception.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 401 — credenciais inválidas
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponseDTO> handleAuthentication(AuthenticationException ex) {
        return buildResponse(ex.getStatus(), ex.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponseDTO> handleBadRequest(BadRequestException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorResponseDTO> handleSecurity(SecurityException ex) {
        String msg = ex.getMessage();
        HttpStatus status = HttpStatus.UNAUTHORIZED;

        if ("REPLAY_DETECTED".equals(msg) || "DEVICE_BLACKLISTED".equals(msg) || "DEVICE_MISMATCH".equals(msg)) {
            status = HttpStatus.FORBIDDEN;
        }

        return buildResponse(status, msg != null ? msg : "Erro de segurança");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDTO> handleUnreadable(HttpMessageNotReadableException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, "Corpo da requisição inválido ou ausente");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleGeneric(Exception ex) {
        System.err.println("Erro interno no auth-service: " + ex.getMessage());
        ex.printStackTrace();
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno do servidor");
    }

    private ResponseEntity<ErrorResponseDTO> buildResponse(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ErrorResponseDTO(status.value(), message));
    }
}