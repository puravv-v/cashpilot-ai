package com.cashpilot.backend.dto;

import java.math.BigDecimal;

public class CashFlowSummary {

    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;
    private BigDecimal netCashFlow;

    public CashFlowSummary(BigDecimal totalIncome,
                           BigDecimal totalExpenses,
                           BigDecimal netCashFlow) {
        this.totalIncome = totalIncome;
        this.totalExpenses = totalExpenses;
        this.netCashFlow = netCashFlow;
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