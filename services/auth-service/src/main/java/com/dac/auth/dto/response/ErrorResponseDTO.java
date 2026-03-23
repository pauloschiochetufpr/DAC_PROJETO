package com.dac.auth.dto.response;

public class ErrorResponseDTO {
    private int status;
    private String message;

    public ErrorResponseDTO(int status, String message) {
        this.status = status;
        this.message = message;
    }

    public int getStatus() { return status; }
    public String getMessage() { return message; }
}