package com.cashpilot.backend.dto;

import java.math.BigDecimal;

public class CashFlowSummary {

    private BigDecimal startingCash;
    private BigDecimal currentCash;
    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private BigDecimal netCashFlow;

    public CashFlowSummary(
            BigDecimal startingCash,
            BigDecimal currentCash,
            BigDecimal totalIncome,
            BigDecimal totalExpenses,
            BigDecimal netCashFlow) {

        this.startingCash = startingCash;
        this.currentCash = currentCash;
        this.totalIncome = totalIncome;
        this.totalExpenses = totalExpenses;
        this.netCashFlow = netCashFlow;
    }

    public BigDecimal getStartingCash() {
        return startingCash;
    }

    public BigDecimal getCurrentCash() {
        return currentCash;
    }

    public BigDecimal getTotalIncome() {
        return totalIncome;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public BigDecimal getNetCashFlow() {
        return netCashFlow;
    }
}