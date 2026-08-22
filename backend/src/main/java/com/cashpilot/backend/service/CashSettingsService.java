package com.cashpilot.backend.service;

import com.cashpilot.backend.entity.CashSettings;
import com.cashpilot.backend.repository.CashSettingsRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class CashSettingsService {

    private static final Long SETTINGS_ID = 1L;

    private final CashSettingsRepository repository;

    public CashSettingsService(CashSettingsRepository repository) {
        this.repository = repository;
    }

    public CashSettings getSettings() {

        return repository.findById(SETTINGS_ID)
                .orElseGet(() ->
                        repository.save(
                                new CashSettings(
                                        SETTINGS_ID,
                                        BigDecimal.ZERO
                                )
                        )
                );
    }

    public BigDecimal getStartingCash() {
        return getSettings().getStartingCash();
    }

    public CashSettings updateStartingCash(BigDecimal amount) {

        if (amount == null) {
            throw new IllegalArgumentException(
                    "Starting cash cannot be null."
            );
        }

        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Starting cash cannot be negative."
            );
        }

        CashSettings settings = getSettings();

        settings.setStartingCash(amount);

        return repository.save(settings);
    }
}