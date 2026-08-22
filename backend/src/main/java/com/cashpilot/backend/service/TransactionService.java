package com.cashpilot.backend.service;

import com.cashpilot.backend.dto.CashFlowSummary;
import com.cashpilot.backend.entity.Transaction;
import com.cashpilot.backend.entity.TransactionType;
import com.cashpilot.backend.entity.User;
import com.cashpilot.backend.repository.TransactionRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final CashSettingsService cashSettingsService;
    private final AuthenticatedUserService authenticatedUserService;

    public TransactionService(
            TransactionRepository transactionRepository,
            CashSettingsService cashSettingsService,
            AuthenticatedUserService authenticatedUserService) {

        this.transactionRepository = transactionRepository;
        this.cashSettingsService = cashSettingsService;
        this.authenticatedUserService = authenticatedUserService;
    }

    public Transaction createTransaction(
            Transaction transaction) {

        validateTransaction(transaction);

        User currentUser =
                authenticatedUserService.getCurrentUser();

        transaction.setUser(currentUser);

        return transactionRepository.save(transaction);
    }

    public Transaction updateTransaction(
            Long id,
            Transaction updatedTransaction) {

        validateTransaction(updatedTransaction);

        User currentUser =
                authenticatedUserService.getCurrentUser();

        Transaction existing =
                transactionRepository
                        .findByIdAndUser(id, currentUser)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Transaction not found."
                                )
                        );

        existing.setAmount(
                updatedTransaction.getAmount()
        );

        existing.setType(
                updatedTransaction.getType()
        );

        existing.setDescription(
                updatedTransaction.getDescription()
        );

        existing.setTransactionDate(
                updatedTransaction.getTransactionDate()
        );

        return transactionRepository.save(existing);
    }

    public List<Transaction> getAllTransactions() {

        User currentUser =
                authenticatedUserService.getCurrentUser();

        return transactionRepository.findByUser(currentUser);
    }

    public void deleteTransaction(Long id) {

        User currentUser =
                authenticatedUserService.getCurrentUser();

        Transaction transaction =
                transactionRepository
                        .findByIdAndUser(id, currentUser)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Transaction not found."
                                )
                        );

        transactionRepository.delete(transaction);
    }

    private void validateTransaction(
            Transaction transaction) {

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
                transaction.getDescription()
                        .trim()
                        .isEmpty()) {

            throw new IllegalArgumentException(
                    "Transaction description is required."
            );
        }

        if (transaction.getTransactionDate() == null) {
            throw new IllegalArgumentException(
                    "Transaction date is required."
            );
        }

        if (transaction.getTransactionDate()
                .isAfter(LocalDateTime.now())) {

            throw new IllegalArgumentException(
                    "Recorded transactions cannot have a future date."
            );
        }
    }

    public BigDecimal getTotalIncome() {

        User currentUser =
                authenticatedUserService.getCurrentUser();

        return transactionRepository
                .findByUserAndType(
                        currentUser,
                        TransactionType.INCOME
                )
                .stream()
                .map(Transaction::getAmount)
                .reduce(
                        BigDecimal.ZERO,
                        BigDecimal::add
                );
    }

    public BigDecimal getTotalExpenses() {

        User currentUser =
                authenticatedUserService.getCurrentUser();

        return transactionRepository
                .findByUserAndType(
                        currentUser,
                        TransactionType.EXPENSE
                )
                .stream()
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