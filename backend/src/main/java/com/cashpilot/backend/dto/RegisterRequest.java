package com.cashpilot.backend.dto;

import java.math.BigDecimal;

public class RegisterRequest {

    private String email;
    private String password;
    private String businessName;
    private BigDecimal startingCash;

    public RegisterRequest() {
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getBusinessName() {
        return businessName;
    }

    public BigDecimal getStartingCash() {
        return startingCash;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public void setStartingCash(BigDecimal startingCash) {
        this.startingCash = startingCash;
    }
}