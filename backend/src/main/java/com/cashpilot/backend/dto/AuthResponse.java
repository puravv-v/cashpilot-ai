package com.cashpilot.backend.dto;

public class AuthResponse {

    private String token;
    private Long userId;
    private String email;
    private String businessName;

    public AuthResponse(
            String token,
            Long userId,
            String email,
            String businessName
    ) {
        this.token = token;
        this.userId = userId;
        this.email = email;
        this.businessName = businessName;
    }

    public String getToken() {
        return token;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getBusinessName() {
        return businessName;
    }
}