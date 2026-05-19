package com.dac.gerente.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Erros de negócio lançados pelo service (404, 409, 400, etc.)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        return buildResponse(ex.getStatusCode().value(), ex.getReason());
    }

    // Body ausente ou JSON malformado
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleNotReadable(HttpMessageNotReadableException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST.value(),
            "Body ausente ou JSON inválido");
    }

    // Parâmetro de tipo errado na URL (ex: CPF com caractere inválido)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST.value(),
            "Parâmetro inválido: " + ex.getName());
    }

    // Rota não encontrada
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(NoHandlerFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND.value(),
            "Rota não encontrada: " + ex.getRequestURL());
    }

    // Erros inesperados — não expõe detalhes internos
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        System.err.println("gerente-service: erro inesperado - " + ex.getMessage());
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Erro interno do servidor");
    }

    private ResponseEntity<Map<String, Object>> buildResponse(int status, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status);
        body.put("message", message != null ? message : "Erro desconhecido");
        return ResponseEntity.status(status).body(body);
    }
}