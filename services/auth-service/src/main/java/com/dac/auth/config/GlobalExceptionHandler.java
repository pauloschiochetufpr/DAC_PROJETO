package com.dac.auth.config;

import com.dac.auth.dto.response.ErrorResponseDTO;
import com.dac.auth.exception.AuthenticationException;
import com.dac.auth.exception.BadRequestException;
import com.dac.auth.util.DevLog;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 401 - credenciais inválidas
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponseDTO> handleAuthentication(AuthenticationException ex) {
        DevLog.log("AuthenticationException - status: " + ex.getStatus().value() + ", mensagem: " + ex.getMessage());
        return buildResponse(ex.getStatus(), ex.getMessage());
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponseDTO> handleBadRequest(BadRequestException ex) {
        DevLog.log("BadRequestException - mensagem: " + ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorResponseDTO> handleSecurity(SecurityException ex) {
        String code = ex.getMessage();
        HttpStatus status = HttpStatus.UNAUTHORIZED;

        if ("REPLAY_DETECTED".equals(code) || "DEVICE_BLACKLISTED".equals(code) || "DEVICE_MISMATCH".equals(code)) {
            status = HttpStatus.FORBIDDEN;
        }

        String mensagem = securityCodeToMessage(code);
        DevLog.log("SecurityException - codigo: " + code + ", status: " + status.value() + ", mensagem: " + mensagem);
        return buildResponse(status, mensagem);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponseDTO> handleUnreadable(HttpMessageNotReadableException ex) {
        DevLog.log("Corpo da requisiçao inválido ou ausente - " + ex.getMessage());
        return buildResponse(HttpStatus.BAD_REQUEST, "Corpo da requisição inválido ou ausente");
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponseDTO> handleGeneric(Exception ex) {
        DevLog.log("Erro interno nao tratado - " + ex.getClass().getSimpleName() + ": " + ex.getMessage());
        ex.printStackTrace();
        return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno do servidor");
    }

    private ResponseEntity<ErrorResponseDTO> buildResponse(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ErrorResponseDTO(status.value(), message));
    }

    // securityCodeToMessage | traduz códigos internos de SecurityException para mensagens legíveis pelo front
    private String securityCodeToMessage(String code) {
        if (code == null) return "Erro de segurança";
        switch (code) {
            case "INVALID_TOKEN":      return "Token de refresh inválido ou inexistente";
            case "REPLAY_DETECTED":    return "Reutilização de token detectada - sessão encerrada por segurança";
            case "DEVICE_BLACKLISTED": return "Dispositivo bloqueado";
            case "DEVICE_MISMATCH":    return "Dispositivo incompativel com a sessão - sessão encerrada por segurança";
            case "DEVICE_NOT_FOUND":   return "Dispositivo não encontrado";
            case "ABSOLUTE_EXPIRED":   return "Sessão expirada (limite absoluto atingido)";
            case "SESSION_EXPIRED":    return "Sessão expirada";
            case "INACTIVITY_EXPIRED": return "Sessão expirada por inatividade";
            default:                   return code;
        }
    }
}