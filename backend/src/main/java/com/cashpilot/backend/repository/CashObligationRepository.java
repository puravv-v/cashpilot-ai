package com.cashpilot.backend.repository;

import com.cashpilot.backend.entity.CashObligation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface CashObligationRepository
        extends JpaRepository<CashObligation, Long> {

    List<CashObligation>
    findByDueDateGreaterThanEqualOrderByDueDateAsc(
            LocalDate date
    );
}