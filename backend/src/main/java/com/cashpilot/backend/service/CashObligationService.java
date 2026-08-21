package com.cashpilot.backend.service;
import com.cashpilot.backend.dto.CashFlowProjection;
import com.cashpilot.backend.entity.CashObligationType;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;

import com.cashpilot.backend.entity.CashObligation;
import com.cashpilot.backend.repository.CashObligationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import com.cashpilot.backend.dto.CashFlowRisk;
import com.cashpilot.backend.dto.FinancialRecommendation;
import java.time.LocalDate;

@Service
public class CashObligationService {

    private final CashObligationRepository repository;

    public CashObligationService(CashObligationRepository repository) {
        this.repository = repository;
    }

    public CashObligation createObligation(CashObligation obligation) {
        return repository.save(obligation);
    }

    public List<CashObligation> getUpcomingObligations() {
        return repository.findByDueDateGreaterThanEqualOrderByDueDateAsc(
                LocalDate.now()
        );
    }

    public List<CashObligation> getAllObligations() {
        return repository.findAll();
    }
    public void deleteObligation(Long id) {
        repository.deleteById(id);
    }
    public List<CashFlowProjection> getCashFlowProjection(
        BigDecimal currentCash) {

    List<CashObligation> obligations =
            repository.findByDueDateGreaterThanEqualOrderByDueDateAsc(
                    LocalDate.now()
            );

    obligations.sort(
            Comparator.comparing(CashObligation::getDueDate)
    );

    List<CashFlowProjection> projections = new ArrayList<>();

    BigDecimal runningBalance = currentCash;

    for (CashObligation obligation : obligations) {

        BigDecimal change = obligation.getAmount();

        if (obligation.getType() == CashObligationType.EXPENSE) {
            change = change.negate();
        }

        runningBalance = runningBalance.add(change);

        projections.add(
                new CashFlowProjection(
                        obligation.getDueDate(),
                        runningBalance,
                        change,
                        obligation.getDescription()
                )
        );
    }

    return projections;
}
public CashFlowRisk detectCashFlowRisk(BigDecimal currentCash) {

    List<CashFlowProjection> projections =
            getCashFlowProjection(currentCash);

    if (projections.isEmpty()) {
        return new CashFlowRisk(
                false,
                "LOW",
                null,
                currentCash,
                "No upcoming cash-flow obligations detected.",
                null
        );
    }

    CashFlowProjection lowestPoint = projections.get(0);

    for (CashFlowProjection projection : projections) {

        if (projection.getCashBalance()
                .compareTo(lowestPoint.getCashBalance()) < 0) {

            lowestPoint = projection;
        }
    }

    BigDecimal balance = lowestPoint.getCashBalance();

    /*
     * Initial risk threshold.
     *
     * Later we will make this configurable
     * for each business.
     */
    BigDecimal criticalThreshold = new BigDecimal("10000");
    BigDecimal warningThreshold = new BigDecimal("25000");

    String severity;

    if (balance.compareTo(criticalThreshold) <= 0) {
        severity = "CRITICAL";
    } else if (balance.compareTo(warningThreshold) <= 0) {
        severity = "WARNING";
    } else {
        severity = "LOW";
    }

    boolean riskDetected = !severity.equals("LOW");

    String message;

    if (severity.equals("CRITICAL")) {

        message = "Projected cash balance falls to ₹"
                + balance
                + " on "
                + lowestPoint.getDate()
                + ".";

    } else if (severity.equals("WARNING")) {

        message = "Projected cash balance may become tight, "
                + "falling to ₹"
                + balance
                + " on "
                + lowestPoint.getDate()
                + ".";

    } else {

        message = "Projected cash flow remains healthy.";
    }

    return new CashFlowRisk(
            riskDetected,
            severity,
            lowestPoint.getDate(),
            balance,
            message,
            lowestPoint.getDescription()
    );
}
public List<FinancialRecommendation> getRecommendations(
        BigDecimal currentCash) {

    List<CashObligation> obligations =
            repository.findByDueDateGreaterThanEqualOrderByDueDateAsc(
                    LocalDate.now()
            );

    List<FinancialRecommendation> recommendations =
            new ArrayList<>();

    /*
     * Find the largest upcoming expense.
     */
    CashObligation largestExpense = null;

    for (CashObligation obligation : obligations) {

        if (obligation.getType() == CashObligationType.EXPENSE) {

            if (largestExpense == null ||
                    obligation.getAmount()
                            .compareTo(largestExpense.getAmount()) > 0) {

                largestExpense = obligation;
            }
        }
    }

    /*
     * Recommendation 1:
     * Handle the largest expense.
     */
    if (largestExpense != null) {

        recommendations.add(
                new FinancialRecommendation(
                        "HIGH",
                        "Prepare for largest upcoming expense",
                        "The largest upcoming expense is ₹"
                                + largestExpense.getAmount()
                                + " for "
                                + largestExpense.getDescription()
                                + ".",
                        "Ensure sufficient cash is available before "
                                + largestExpense.getDueDate()
                                + "."
                )
        );
    }

    /*
     * Find income that arrives before the largest expense.
     */
    if (largestExpense != null) {

        for (CashObligation obligation : obligations) {

            if (obligation.getType() == CashObligationType.INCOME
                    && !obligation.getDueDate()
                    .isAfter(largestExpense.getDueDate())) {

                recommendations.add(
                        new FinancialRecommendation(
                                "HIGH",
                                "Accelerate incoming payment",
                                "₹"
                                        + obligation.getAmount()
                                        + " is expected from "
                                        + obligation.getDescription()
                                        + " before the largest expense.",
                                "Follow up and collect this payment "
                                        + "before "
                                        + largestExpense.getDueDate()
                                        + "."
                        )
                );

                break;
            }
        }
    }

    /*
     * Check projected cash risk.
     */
    CashFlowRisk risk = detectCashFlowRisk(currentCash);

    if (risk.isRiskDetected()) {

        recommendations.add(
                new FinancialRecommendation(
                        risk.getSeverity().equals("CRITICAL")
                                ? "CRITICAL"
                                : "MEDIUM",
                        "Maintain a cash buffer",
                        risk.getMessage(),
                        "Review upcoming expenses and preserve "
                                + "enough liquidity to avoid a cash shortage."
                )
        );
    }

    /*
     * AWS / infrastructure style recurring expense.
     */
    for (CashObligation obligation : obligations) {

        if (obligation.getType() == CashObligationType.EXPENSE
                && obligation.getDescription()
                .toLowerCase()
                .contains("aws")) {

            recommendations.add(
                    new FinancialRecommendation(
                            "MEDIUM",
                            "Review infrastructure spending",
                            "An AWS infrastructure expense of ₹"
                                    + obligation.getAmount()
                                    + " is upcoming.",
                            "Review infrastructure usage and identify "
                                    + "unused or unnecessary resources."
                    )
            );

            break;
        }
    }

    return recommendations;
}
}