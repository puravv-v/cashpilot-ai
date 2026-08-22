package com.cashpilot.backend.controller;

import com.cashpilot.backend.dto.CashFlowProjection;
import com.cashpilot.backend.dto.CashFlowRisk;
import com.cashpilot.backend.dto.CashFlowSummary;
import com.cashpilot.backend.dto.FinancialRecommendation;
import com.cashpilot.backend.service.CashObligationService;
import com.cashpilot.backend.service.TransactionService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cashflow")
@CrossOrigin(origins = "*")
public class CashFlowController {

    private final TransactionService transactionService;
    private final CashObligationService cashObligationService;

    public CashFlowController(
            TransactionService transactionService,
            CashObligationService cashObligationService) {

        this.transactionService = transactionService;
        this.cashObligationService = cashObligationService;
    }

    @GetMapping("/summary")
    public ResponseEntity<CashFlowSummary> getSummary() {

        return ResponseEntity.ok(
                transactionService.getCashFlowSummary()
        );
    }

    @GetMapping("/projection")
    public ResponseEntity<List<CashFlowProjection>> getProjection() {

        return ResponseEntity.ok(
                cashObligationService.getCashFlowProjection(
                        transactionService.getCurrentCash()
                )
        );
    }

    @GetMapping("/risk")
    public ResponseEntity<CashFlowRisk> getRisk() {

        return ResponseEntity.ok(
                cashObligationService.detectCashFlowRisk(
                        transactionService.getCurrentCash()
                )
        );
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<FinancialRecommendation>>
    getRecommendations() {

        return ResponseEntity.ok(
                cashObligationService.getRecommendations(
                        transactionService.getCurrentCash()
                )
        );
    }
}