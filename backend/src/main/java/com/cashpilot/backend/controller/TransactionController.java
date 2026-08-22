package com.cashpilot.backend.controller;

import com.cashpilot.backend.entity.Transaction;
import com.cashpilot.backend.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(
            @RequestBody Transaction transaction) {

        return ResponseEntity.ok(
                transactionService.createTransaction(transaction)
        );
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> getAllTransactions() {

        return ResponseEntity.ok(
                transactionService.getAllTransactions()
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transaction> updateTransaction(
            @PathVariable Long id,
            @RequestBody Transaction transaction) {

        return ResponseEntity.ok(
                transactionService.updateTransaction(id, transaction)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long id) {

        transactionService.deleteTransaction(id);

        return ResponseEntity.noContent().build();
    }
}