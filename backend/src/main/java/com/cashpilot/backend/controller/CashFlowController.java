package com.cashpilot.backend.controller;

import com.cashpilot.backend.dto.AIAnalysisRequest;
import com.cashpilot.backend.dto.AIAnalysisResponse;
import com.cashpilot.backend.dto.CashFlowRisk;
import com.cashpilot.backend.dto.FinancialRecommendation;
import com.cashpilot.backend.service.AIAnalysisService;
import com.cashpilot.backend.service.CashObligationService;
import com.cashpilot.backend.service.TransactionService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/cashflow")
@CrossOrigin(origins = "*")
public class CashFlowController {

    private final TransactionService transactionService;
    private final CashObligationService cashObligationService;
    private final AIAnalysisService aiAnalysisService;

    public CashFlowController(
            TransactionService transactionService,
            CashObligationService cashObligationService,
            AIAnalysisService aiAnalysisService) {

        this.transactionService = transactionService;
        this.cashObligationService = cashObligationService;
        this.aiAnalysisService = aiAnalysisService;
    }

    @GetMapping("/summary")
    public ResponseEntity<?> getSummary() {

        return ResponseEntity.ok(
                transactionService.getCashFlowSummary()
        );
    }

    @PostMapping("/ai-analysis")
    public ResponseEntity<AIAnalysisResponse> getAIAnalysis(
            @RequestParam BigDecimal currentCash) {

        CashFlowRisk risk =
                cashObligationService.detectCashFlowRisk(currentCash);

        List<FinancialRecommendation> recommendations =
                cashObligationService.getRecommendations(currentCash);

        AIAnalysisRequest request =
                new AIAnalysisRequest(
                        currentCash,
                        risk,
                        recommendations
                );

        AIAnalysisResponse response =
                aiAnalysisService.analyze(request);

        return ResponseEntity.ok(response);
    }
}