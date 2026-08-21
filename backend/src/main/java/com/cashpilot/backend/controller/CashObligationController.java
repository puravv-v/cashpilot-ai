package com.cashpilot.backend.controller;

import com.cashpilot.backend.entity.CashObligation;
import com.cashpilot.backend.service.CashObligationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}