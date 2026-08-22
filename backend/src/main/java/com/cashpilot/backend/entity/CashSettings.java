package com.cashpilot.backend.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cash_settings")
public class CashSettings {

    @Id
    private Long id;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal startingCash;

    public CashSettings() {
    }

    public CashSettings(Long id, BigDecimal startingCash) {
        this.id = id;
        this.startingCash = startingCash;
    }

    public Long getId() {
        return id;
    }

    public BigDecimal getStartingCash() {
        return startingCash;
    }

    public void setStartingCash(BigDecimal startingCash) {
        this.startingCash = startingCash;
    }
}