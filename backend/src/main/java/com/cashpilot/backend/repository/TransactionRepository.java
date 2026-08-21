package com.cashpilot.backend.repository;

import com.cashpilot.backend.entity.Transaction;
import com.cashpilot.backend.entity.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByType(TransactionType type);
}