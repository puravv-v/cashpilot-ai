package com.cashpilot.backend.service;

import com.cashpilot.backend.entity.CashSettings;
import com.cashpilot.backend.entity.User;
import com.cashpilot.backend.repository.CashSettingsRepository;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class CashSettingsService {

    private final CashSettingsRepository repository;
    private final AuthenticatedUserService authenticatedUserService;

    public CashSettingsService(
            CashSettingsRepository repository,
            AuthenticatedUserService authenticatedUserService) {

        this.repository = repository;
        this.authenticatedUserService =
                authenticatedUserService;
    }

    public CashSettings getSettings() {

        User currentUser =
                authenticatedUserService.getCurrentUser();

        return repository.findByUser(currentUser)
                .orElseGet(() -> {

                    /*
                     * This is only a fallback for older users
                     * who were created before starting cash was
                     * added to registration.
                     */
                    CashSettings settings =
                            new CashSettings(
                                    BigDecimal.ZERO,
                                    currentUser
                            );

                    return repository.save(settings);
                });
    }

    public BigDecimal getStartingCash() {

        return getSettings().getStartingCash();
    }
}