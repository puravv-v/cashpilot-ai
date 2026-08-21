package com.cashpilot.backend.dto;

public class FinancialRecommendation {

    private String priority;
    private String title;
    private String reason;
    private String action;

    public FinancialRecommendation(
            String priority,
            String title,
            String reason,
            String action) {

        this.priority = priority;
        this.title = title;
        this.reason = reason;
        this.action = action;
    }

    public String getPriority() {
        return priority;
    }

    public String getTitle() {
        return title;
    }

    public String getReason() {
        return reason;
    }

    public String getAction() {
        return action;
    }
}