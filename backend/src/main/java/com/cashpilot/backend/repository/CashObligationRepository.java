package com.cashpilot.backend.repository;

import com.cashpilot.backend.entity.CashObligation;
import com.cashpilot.backend.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CashObligationRepository
        extends JpaRepository<CashObligation, Long> {

    List<CashObligation> findByUser(User user);

    List<CashObligation>
    findByUserAndDueDateGreaterThanEqualOrderByDueDateAsc(
            User user,
            LocalDate date
    );

    Optional<CashObligation> findByIdAndUser(
            Long id,
            User user
    );

    List<CashObligation> findByUserIsNull();
}