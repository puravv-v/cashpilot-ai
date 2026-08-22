package com.cashpilot.backend.repository;

import com.cashpilot.backend.entity.CashSettings;
import com.cashpilot.backend.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CashSettingsRepository
        extends JpaRepository<CashSettings, Long> {

    Optional<CashSettings> findByUser(User user);

    Optional<CashSettings> findByUserIsNull();
}