package com.dac.auth.dto.response;

public class ValidateResponseDTO {
    private String userId;
    private String role;
    private String email;

    public ValidateResponseDTO(String userId, String role, String email) {
        this.userId = userId;
        this.role = role;
        this.email = email;
    }

    public String getUserId() { return userId; }
    public String getRole() { return role; }
    public String getEmail() { return email; }
}