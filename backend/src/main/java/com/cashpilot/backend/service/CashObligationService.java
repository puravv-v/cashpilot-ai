package com.cashpilot.backend.service;

import com.cashpilot.backend.entity.CashObligation;
import com.cashpilot.backend.repository.CashObligationRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class CashObligationService {

    private final CashObligationRepository repository;

    public CashObligationService(CashObligationRepository repository) {
        this.repository = repository;
    }

    public CashObligation createObligation(CashObligation obligation) {
        return repository.save(obligation);
    }

    public List<CashObligation> getUpcomingObligations() {
        return repository.findByDueDateGreaterThanEqualOrderByDueDateAsc(
                LocalDate.now()
        );
    }

    public List<CashObligation> getAllObligations() {
        return repository.findAll();
    }
}