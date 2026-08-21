package com.cashpilot.backend.repository;

import com.cashpilot.backend.entity.CashObligation;
import com.cashpilot.backend.entity.CashObligationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface CashObligationRepository
        extends JpaRepository<CashObligation, Long> {

    List<CashObligation> findByDueDateGreaterThanEqualOrderByDueDateAsc(
            LocalDate date
    );

    List<CashObligation> findByTypeAndDueDateGreaterThanEqualOrderByDueDateAsc(
            CashObligationType type,
            LocalDate date
    );
}