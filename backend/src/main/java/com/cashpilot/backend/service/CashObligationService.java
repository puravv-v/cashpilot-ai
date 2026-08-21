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
}