package com.cashpilot.backend.controller;

import com.cashpilot.backend.entity.CashSettings;
import com.cashpilot.backend.service.CashSettingsService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "*")
public class CashSettingsController {

    private final CashSettingsService service;

    public CashSettingsController(
            CashSettingsService service) {

        this.service = service;
    }

    @GetMapping("/starting-cash")
    public ResponseEntity<CashSettings> getStartingCash() {

        return ResponseEntity.ok(
                service.getSettings()
        );
    }
}