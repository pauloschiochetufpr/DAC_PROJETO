package com.dac.auth.dto.response;

import java.time.LocalDateTime;

public class ErrorResponseDTO {

    private int status;

    private String message;

    private String timestamp;

    public ErrorResponseDTO(int status, String message) {
        this.status = status;
        this.message = message;
        this.timestamp = LocalDateTime.now().toString();
    }

    public int getStatus() { return status; }
    public String getMessage() { return message; }
    public String getTimestamp() { return timestamp; }
}