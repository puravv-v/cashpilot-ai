package com.cashpilot.backend.repository;

import com.cashpilot.backend.entity.CashSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CashSettingsRepository
        extends JpaRepository<CashSettings, Long> {
}