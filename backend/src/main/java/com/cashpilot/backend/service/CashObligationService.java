package com.cashpilot.backend.service;

import com.cashpilot.backend.dto.CashFlowProjection;
import com.cashpilot.backend.dto.CashFlowRisk;
import com.cashpilot.backend.dto.FinancialRecommendation;
import com.cashpilot.backend.entity.CashObligation;
import com.cashpilot.backend.entity.CashObligationType;
import com.cashpilot.backend.entity.Transaction;
import com.cashpilot.backend.entity.TransactionType;
import com.cashpilot.backend.repository.CashObligationRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class CashObligationService {

    private final CashObligationRepository repository;
    private final TransactionService transactionService;

    public CashObligationService(
            CashObligationRepository repository,
            TransactionService transactionService) {

        this.repository = repository;
        this.transactionService = transactionService;
    }

    // =====================================================
    // CREATE
    // =====================================================

    public CashObligation createObligation(
            CashObligation obligation) {

        validateFutureDate(obligation.getDueDate());

        return repository.save(obligation);
    }

    // =====================================================
    // UPDATE
    // =====================================================

    public CashObligation updateObligation(
            Long id,
            CashObligation updated) {

        validateFutureDate(updated.getDueDate());

        CashObligation existing =
                repository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Upcoming cash-flow item not found."
                                )
                        );

        existing.setAmount(updated.getAmount());
        existing.setType(updated.getType());
        existing.setDescription(updated.getDescription());
        existing.setDueDate(updated.getDueDate());

        return repository.save(existing);
    }

    // =====================================================
    // MARK AS DONE
    // =====================================================

    public Transaction markAsDone(
            Long id,
            LocalDate actualDate) {

        if (actualDate == null) {
            throw new IllegalArgumentException(
                    "Actual date is required."
            );
        }

        if (actualDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "A completed cash flow cannot have a future date."
            );
        }

        CashObligation obligation =
                repository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Upcoming cash-flow item not found."
                                )
                        );

        TransactionType transactionType =
                obligation.getType() == CashObligationType.INCOME
                        ? TransactionType.INCOME
                        : TransactionType.EXPENSE;

        /*
         * Convert the future item into an actual transaction.
         *
         * We use the confirmed actual date at the start of that day.
         */
        Transaction transaction =
                new Transaction(
                        obligation.getAmount(),
                        transactionType,
                        obligation.getDescription(),
                        actualDate.atStartOfDay()
                );

        Transaction savedTransaction =
                transactionService.createTransaction(transaction);

        /*
         * Delete the future obligation only after the actual
         * transaction has been successfully created.
         */
        repository.deleteById(id);

        return savedTransaction;
    }

    // =====================================================
    // VALIDATION
    // =====================================================

    private void validateFutureDate(LocalDate dueDate) {

        if (dueDate == null) {
            throw new IllegalArgumentException(
                    "Future cash-flow date is required."
            );
        }

        /*
         * Future cash flows must be strictly after today.
         */
        if (!dueDate.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Future cash flows must have a future date."
            );
        }
    }

    // =====================================================
    // GET ALL
    // =====================================================

    public List<CashObligation> getAllObligations() {
        return repository.findAll();
    }

    // =====================================================
    // GET UPCOMING
    // =====================================================

    public List<CashObligation> getUpcomingObligations() {

        return repository
                .findByDueDateGreaterThanEqualOrderByDueDateAsc(
                        LocalDate.now().plusDays(1)
                );
    }

    // =====================================================
    // DELETE ONE
    // =====================================================

    public void deleteObligation(Long id) {
        repository.deleteById(id);
    }

    // =====================================================
    // DELETE ALL
    // =====================================================

    public void deleteAllObligations() {
        repository.deleteAll();
    }

    // =====================================================
    // CASH FLOW PROJECTION
    // =====================================================

    public List<CashFlowProjection> getCashFlowProjection(
            BigDecimal currentCash) {

        List<CashObligation> obligations =
                repository.findByDueDateGreaterThanEqualOrderByDueDateAsc(
                        LocalDate.now().plusDays(1)
                );

        obligations.sort(
                Comparator.comparing(
                        CashObligation::getDueDate
                )
        );

        List<CashFlowProjection> projections =
                new ArrayList<>();

        BigDecimal runningBalance = currentCash;

        for (CashObligation obligation : obligations) {

            BigDecimal change =
                    obligation.getAmount();

            if (obligation.getType()
                    == CashObligationType.EXPENSE) {

                change = change.negate();
            }

            runningBalance =
                    runningBalance.add(change);

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

    // =====================================================
    // CASH FLOW RISK
    // =====================================================

    public CashFlowRisk detectCashFlowRisk(
            BigDecimal currentCash) {

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

        CashFlowProjection lowestPoint =
                projections.get(0);

        for (CashFlowProjection projection : projections) {

            if (projection.getCashBalance()
                    .compareTo(
                            lowestPoint.getCashBalance()
                    ) < 0) {

                lowestPoint = projection;
            }
        }

        BigDecimal balance =
                lowestPoint.getCashBalance();

        BigDecimal criticalThreshold =
                new BigDecimal("10000");

        BigDecimal warningThreshold =
                new BigDecimal("25000");

        String severity;

        if (balance.compareTo(
                criticalThreshold) <= 0) {

            severity = "CRITICAL";

        } else if (balance.compareTo(
                warningThreshold) <= 0) {

            severity = "WARNING";

        } else {

            severity = "LOW";
        }

        boolean riskDetected =
                !severity.equals("LOW");

        String message;

        if (severity.equals("CRITICAL")) {

            message =
                    "Projected cash balance falls to ₹"
                            + balance
                            + " on "
                            + lowestPoint.getDate()
                            + ".";

        } else if (severity.equals("WARNING")) {

            message =
                    "Projected cash balance may become tight, "
                            + "falling to ₹"
                            + balance
                            + " on "
                            + lowestPoint.getDate()
                            + ".";

        } else {

            message =
                    "Projected cash flow remains healthy.";
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

    // =====================================================
    // RECOMMENDATIONS
    // =====================================================

    public List<FinancialRecommendation> getRecommendations(
            BigDecimal currentCash) {

        List<CashObligation> obligations =
                repository
                        .findByDueDateGreaterThanEqualOrderByDueDateAsc(
                                LocalDate.now().plusDays(1)
                        );

        List<FinancialRecommendation> recommendations =
                new ArrayList<>();

        CashObligation largestExpense = null;

        for (CashObligation obligation : obligations) {

            if (obligation.getType()
                    == CashObligationType.EXPENSE) {

                if (largestExpense == null ||
                        obligation.getAmount()
                                .compareTo(
                                        largestExpense.getAmount()
                                ) > 0) {

                    largestExpense = obligation;
                }
            }
        }

        // =================================================
        // LARGEST EXPENSE
        // =================================================

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

        // =================================================
        // INCOMING PAYMENT BEFORE EXPENSE
        // =================================================

        if (largestExpense != null) {

            CashObligation bestIncomingPayment = null;

            for (CashObligation obligation : obligations) {

                if (obligation.getType()
                        == CashObligationType.INCOME
                        && obligation.getDueDate()
                        .isBefore(
                                largestExpense.getDueDate()
                        )) {

                    /*
                     * Prefer the latest incoming payment before
                     * the expense. This gives a more useful
                     * recommendation than simply taking the
                     * first income in the list.
                     */
                    if (bestIncomingPayment == null ||
                            obligation.getDueDate()
                                    .isAfter(
                                            bestIncomingPayment
                                                    .getDueDate()
                                    )) {

                        bestIncomingPayment = obligation;
                    }
                }
            }

            if (bestIncomingPayment != null) {

                recommendations.add(
                        new FinancialRecommendation(
                                "HIGH",
                                "Accelerate incoming payment",
                                "₹"
                                        + bestIncomingPayment.getAmount()
                                        + " is expected from "
                                        + bestIncomingPayment.getDescription()
                                        + " on "
                                        + bestIncomingPayment.getDueDate()
                                        + ", before the "
                                        + largestExpense.getDescription()
                                        + " payment.",
                                "Follow up and collect this payment before "
                                        + largestExpense.getDueDate()
                                        + " if possible."
                        )
                );
            }
        }

        // =================================================
        // CASH RISK
        // =================================================

        CashFlowRisk risk =
                detectCashFlowRisk(currentCash);

        if (risk.isRiskDetected()) {

            recommendations.add(
                    new FinancialRecommendation(
                            risk.getSeverity()
                                    .equals("CRITICAL")
                                    ? "CRITICAL"
                                    : "MEDIUM",

                            "Maintain a cash buffer",

                            risk.getMessage(),

                            "Review upcoming expenses and preserve "
                                    + "enough liquidity to avoid a cash shortage."
                    )
            );
        }

        // =================================================
        // AWS / INFRASTRUCTURE
        // =================================================

        for (CashObligation obligation : obligations) {

            if (obligation.getType()
                    == CashObligationType.EXPENSE
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