package com.cashpilot.backend.controller;

import com.cashpilot.backend.dto.AIAnalysisRequest;
import com.cashpilot.backend.service.AIAnalysisService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AIAnalysisController {

    private final AIAnalysisService aiAnalysisService;

    public AIAnalysisController(AIAnalysisService aiAnalysisService) {
        this.aiAnalysisService = aiAnalysisService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(
            @RequestBody AIAnalysisRequest request) {

        return ResponseEntity.ok(
                aiAnalysisService.analyze(request)
        );
    }
}