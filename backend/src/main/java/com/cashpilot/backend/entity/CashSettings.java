package com.cashpilot.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "cash_settings")
public class CashSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal startingCash;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    public CashSettings() {
    }

    public CashSettings(Long id, BigDecimal startingCash) {
        this.id = id;
        this.startingCash = startingCash;
    }

    public CashSettings(BigDecimal startingCash, User user) {
        this.startingCash = startingCash;
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public BigDecimal getStartingCash() {
        return startingCash;
    }

    public User getUser() {
        return user;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setStartingCash(BigDecimal startingCash) {
        this.startingCash = startingCash;
    }

    public void setUser(User user) {
        this.user = user;
    }
}