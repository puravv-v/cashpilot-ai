package com.cashpilot.backend.controller;

import com.cashpilot.backend.dto.CashFlowSummary;
import com.cashpilot.backend.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cashflow")
@CrossOrigin(origins = "*")
public class CashFlowController {

    private final TransactionService transactionService;

    public CashFlowController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping("/summary")
    public ResponseEntity<CashFlowSummary> getSummary() {

        return ResponseEntity.ok(
                transactionService.getCashFlowSummary()
        );
    }
}