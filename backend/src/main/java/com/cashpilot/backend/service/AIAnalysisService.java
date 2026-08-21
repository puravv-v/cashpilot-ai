package com.cashpilot.backend.service;

import com.cashpilot.backend.dto.AIAnalysisRequest;
import com.cashpilot.backend.dto.AIAnalysisResponse;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class AIAnalysisService {

    private final RestClient restClient;

    public AIAnalysisService(
            @Value("${ai.service.url}") String aiServiceUrl) {

        this.restClient = RestClient.builder()
                .baseUrl(aiServiceUrl)
                .build();
    }

    public AIAnalysisResponse analyze(AIAnalysisRequest request) {

        return restClient.post()
                .uri("/api/ai/analyze")
                .body(request)
                .retrieve()
                .body(AIAnalysisResponse.class);
    }
}