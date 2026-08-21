package com.cashpilot.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class CashFlowRisk {

    private boolean riskDetected;
    private String severity;
    private LocalDate riskDate;
    private BigDecimal projectedBalance;
    private String message;
    private String primaryCause;

    public CashFlowRisk(
            boolean riskDetected,
            String severity,
            LocalDate riskDate,
            BigDecimal projectedBalance,
            String message,
            String primaryCause) {

        this.riskDetected = riskDetected;
        this.severity = severity;
        this.riskDate = riskDate;
        this.projectedBalance = projectedBalance;
        this.message = message;
        this.primaryCause = primaryCause;
    }

    public boolean isRiskDetected() {
        return riskDetected;
    }

    public String getSeverity() {
        return severity;
    }

    public LocalDate getRiskDate() {
        return riskDate;
    }

    public BigDecimal getProjectedBalance() {
        return projectedBalance;
    }

    public String getMessage() {
        return message;
    }

    public String getPrimaryCause() {
        return primaryCause;
    }
}