package com.cashpilot.backend.dto;

public class AIAnalysisResponse {

    private String summary;
    private String riskExplanation;
    private String businessPattern;
    private String priorityAction;
    private String outlook;
    private String goodScenario;
    private String badScenario;

    public AIAnalysisResponse() {
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getRiskExplanation() {
        return riskExplanation;
    }

    public void setRiskExplanation(
            String riskExplanation
    ) {
        this.riskExplanation =
                riskExplanation;
    }

    public String getBusinessPattern() {
        return businessPattern;
    }

    public void setBusinessPattern(
            String businessPattern
    ) {
        this.businessPattern =
                businessPattern;
    }

    public String getPriorityAction() {
        return priorityAction;
    }

    public void setPriorityAction(
            String priorityAction
    ) {
        this.priorityAction =
                priorityAction;
    }

    public String getOutlook() {
        return outlook;
    }

    public void setOutlook(String outlook) {
        this.outlook = outlook;
    }

    public String getGoodScenario() {
        return goodScenario;
    }

    public void setGoodScenario(
            String goodScenario
    ) {
        this.goodScenario =
                goodScenario;
    }

    public String getBadScenario() {
        return badScenario;
    }

    public void setBadScenario(
            String badScenario
    ) {
        this.badScenario =
                badScenario;
    }
}