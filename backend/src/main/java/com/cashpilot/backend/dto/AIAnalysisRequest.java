package com.cashpilot.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class AIAnalysisRequest {

    private BigDecimal currentCash;
    private BigDecimal startingCash;
    private BigDecimal totalIncome;
    private BigDecimal totalExpenses;

    private List<CashFlowProjection> projection;

    private CashFlowRisk risk;

    private List<FinancialRecommendation> recommendations;

    public AIAnalysisRequest() {
    }

    public BigDecimal getCurrentCash() {
        return currentCash;
    }

    public void setCurrentCash(BigDecimal currentCash) {
        this.currentCash = currentCash;
    }

    public BigDecimal getStartingCash() {
        return startingCash;
    }

    public void setStartingCash(BigDecimal startingCash) {
        this.startingCash = startingCash;
    }

    public BigDecimal getTotalIncome() {
        return totalIncome;
    }

    public void setTotalIncome(BigDecimal totalIncome) {
        this.totalIncome = totalIncome;
    }

    public BigDecimal getTotalExpenses() {
        return totalExpenses;
    }

    public void setTotalExpenses(BigDecimal totalExpenses) {
        this.totalExpenses = totalExpenses;
    }

    public List<CashFlowProjection> getProjection() {
        return projection;
    }

    public void setProjection(
        List<CashFlowProjection> projection
    ) {
        this.projection = projection;
    }

    public CashFlowRisk getRisk() {
        return risk;
    }

    public void setRisk(CashFlowRisk risk) {
        this.risk = risk;
    }

    public List<FinancialRecommendation> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(
        List<FinancialRecommendation> recommendations
    ) {
        this.recommendations =
            recommendations;
    }
}