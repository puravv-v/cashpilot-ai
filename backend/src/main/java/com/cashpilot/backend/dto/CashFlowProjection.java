package com.cashpilot.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CashFlowProjection {

    private LocalDate date;
    private BigDecimal cashBalance;
    private BigDecimal change;
    private String description;

    public CashFlowProjection(LocalDate date,
                              BigDecimal cashBalance,
                              BigDecimal change,
                              String description) {
        this.date = date;
        this.cashBalance = cashBalance;
        this.change = change;
        this.description = description;
    }

    public LocalDate getDate() {
        return date;
    }

    public BigDecimal getCashBalance() {
        return cashBalance;
    }

    public BigDecimal getChange() {
        return change;
    }

    public String getDescription() {
        return description;
    }
}