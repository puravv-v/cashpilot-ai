package com.cashpilot.backend.service;

import com.cashpilot.backend.dto.CashFlowSummary;
import com.cashpilot.backend.entity.Transaction;
import com.cashpilot.backend.entity.TransactionType;
import com.cashpilot.backend.repository.TransactionRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CashSettingsService cashSettingsService;

    public TransactionService(
            TransactionRepository transactionRepository,
            CashSettingsService cashSettingsService) {

        this.transactionRepository = transactionRepository;
        this.cashSettingsService = cashSettingsService;
    }

    public Transaction createTransaction(Transaction transaction) {

        validateTransaction(transaction);

        return transactionRepository.save(transaction);
    }

    public Transaction updateTransaction(
            Long id,
            Transaction updatedTransaction) {

        validateTransaction(updatedTransaction);

        Transaction existing =
                transactionRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Transaction not found."
                                )
                        );

        existing.setAmount(updatedTransaction.getAmount());
        existing.setType(updatedTransaction.getType());
        existing.setDescription(updatedTransaction.getDescription());
        existing.setTransactionDate(
                updatedTransaction.getTransactionDate()
        );

        return transactionRepository.save(existing);
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    public void deleteTransaction(Long id) {
        transactionRepository.deleteById(id);
    }

    private void validateTransaction(Transaction transaction) {

        if (transaction == null) {
            throw new IllegalArgumentException(
                    "Transaction cannot be null."
            );
        }

        if (transaction.getAmount() == null ||
                transaction.getAmount()
                        .compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Transaction amount must be greater than zero."
            );
        }

        if (transaction.getType() == null) {
            throw new IllegalArgumentException(
                    "Transaction type is required."
            );
        }

        if (transaction.getDescription() == null ||
                transaction.getDescription().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Transaction description is required."
            );
        }

        if (transaction.getTransactionDate() == null) {
            throw new IllegalArgumentException(
                    "Transaction date is required."
            );
        }

        /*
         * Recorded transactions can only be today or in the past.
         */
        if (transaction.getTransactionDate()
                .isAfter(LocalDateTime.now())) {

            throw new IllegalArgumentException(
                    "Recorded transactions cannot have a future date."
            );
        }
    }

    public BigDecimal getTotalIncome() {

        return transactionRepository.findAll()
                .stream()
                .filter(t -> t.getType() == TransactionType.INCOME)
                .map(Transaction::getAmount)
                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add
                );
    }

    public BigDecimal getTotalExpenses() {

        return transactionRepository.findAll()
                .stream()
                .filter(t -> t.getType() == TransactionType.EXPENSE)
                .map(Transaction::getAmount)
                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add
                );
    }

    public BigDecimal getCurrentCash() {

        BigDecimal startingCash =
                cashSettingsService.getStartingCash();

        BigDecimal income =
                getTotalIncome();

        BigDecimal expenses =
                getTotalExpenses();

        return startingCash
                .add(income)
                .subtract(expenses);
    }

    public CashFlowSummary getCashFlowSummary() {

        BigDecimal startingCash =
                cashSettingsService.getStartingCash();

        BigDecimal totalIncome =
                getTotalIncome();

        BigDecimal totalExpenses =
                getTotalExpenses();

        BigDecimal netCashFlow =
                totalIncome.subtract(totalExpenses);

        BigDecimal currentCash =
                startingCash.add(netCashFlow);

        return new CashFlowSummary(
                startingCash,
                currentCash,
                totalIncome,
                totalExpenses,
                netCashFlow
        );
    }
}