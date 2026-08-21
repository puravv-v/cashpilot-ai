package com.cashpilot.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public class AIAnalysisRequest {

    private BigDecimal currentCash;
    private CashFlowRisk risk;
    private List<FinancialRecommendation> recommendations;

    public AIAnalysisRequest() {
    }

    public AIAnalysisRequest(
            BigDecimal currentCash,
            CashFlowRisk risk,
            List<FinancialRecommendation> recommendations) {
        this.currentCash = currentCash;
        this.risk = risk;
        this.recommendations = recommendations;
    }

    public BigDecimal getCurrentCash() {
        return currentCash;
    }

    public void setCurrentCash(BigDecimal currentCash) {
        this.currentCash = currentCash;
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

    public void setRecommendations(List<FinancialRecommendation> recommendations) {
        this.recommendations = recommendations;
    }
}