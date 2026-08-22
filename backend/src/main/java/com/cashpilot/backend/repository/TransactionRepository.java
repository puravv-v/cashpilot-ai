package com.cashpilot.backend.repository;

import com.cashpilot.backend.entity.Transaction;
import com.cashpilot.backend.entity.TransactionType;
import com.cashpilot.backend.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository
        extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUser(User user);

    List<Transaction> findByUserAndType(
            User user,
            TransactionType type
    );

    java.util.Optional<Transaction> findByIdAndUser(
            Long id,
            User user
    );

    List<Transaction> findByUserIsNull();
}