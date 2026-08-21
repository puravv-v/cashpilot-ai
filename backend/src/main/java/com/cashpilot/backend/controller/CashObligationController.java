package com.cashpilot.backend.controller;

import com.cashpilot.backend.entity.CashObligation;
import com.cashpilot.backend.service.CashObligationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.cashpilot.backend.dto.CashFlowProjection;
import java.math.BigDecimal;
import java.util.List;
import com.cashpilot.backend.dto.CashFlowRisk;
import com.cashpilot.backend.dto.FinancialRecommendation;

@RestController
@RequestMapping("/api/obligations")
@CrossOrigin(origins = "*")
public class CashObligationController {

    private final CashObligationService service;

    public CashObligationController(CashObligationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<CashObligation> create(
            @Valid @RequestBody CashObligation obligation) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(service.createObligation(obligation));
    }

    @GetMapping
    public ResponseEntity<List<CashObligation>> getAll() {
        return ResponseEntity.ok(service.getAllObligations());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<CashObligation>> getUpcoming() {
        return ResponseEntity.ok(service.getUpcomingObligations());
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {

        service.deleteObligation(id);

        return ResponseEntity.noContent().build();
    }
    @GetMapping("/projection")
    public ResponseEntity<List<CashFlowProjection>> getProjection(
            @RequestParam BigDecimal currentCash) {

        return ResponseEntity.ok(
            service.getCashFlowProjection(currentCash)
        );
    }
    @GetMapping("/risk")
    public ResponseEntity<CashFlowRisk> getCashFlowRisk(
            @RequestParam BigDecimal currentCash) {

        return ResponseEntity.ok(
            service.detectCashFlowRisk(currentCash)
        );
    }
    @GetMapping("/recommendations")
    public ResponseEntity<List<FinancialRecommendation>> getRecommendations(
            @RequestParam BigDecimal currentCash) {

        return ResponseEntity.ok(
            service.getRecommendations(currentCash)
        );
    }
}