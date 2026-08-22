package com.cashpilot.backend.service;

import com.cashpilot.backend.dto.AuthResponse;
import com.cashpilot.backend.dto.LoginRequest;
import com.cashpilot.backend.dto.RegisterRequest;
import com.cashpilot.backend.entity.CashObligation;
import com.cashpilot.backend.entity.CashSettings;
import com.cashpilot.backend.entity.Transaction;
import com.cashpilot.backend.entity.User;
import com.cashpilot.backend.repository.CashObligationRepository;
import com.cashpilot.backend.repository.CashSettingsRepository;
import com.cashpilot.backend.repository.TransactionRepository;
import com.cashpilot.backend.repository.UserRepository;
import com.cashpilot.backend.security.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private final TransactionRepository transactionRepository;
    private final CashObligationRepository cashObligationRepository;
    private final CashSettingsRepository cashSettingsRepository;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            TransactionRepository transactionRepository,
            CashObligationRepository cashObligationRepository,
            CashSettingsRepository cashSettingsRepository) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;

        this.transactionRepository = transactionRepository;
        this.cashObligationRepository = cashObligationRepository;
        this.cashSettingsRepository = cashSettingsRepository;
    }

    public AuthResponse register(RegisterRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Registration data is required."
            );
        }

        String email = normalizeEmail(request.getEmail());

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException(
                    "Email is required."
            );
        }

        if (request.getPassword() == null ||
                request.getPassword().length() < 6) {

            throw new IllegalArgumentException(
                    "Password must contain at least 6 characters."
            );
        }

        if (request.getBusinessName() == null ||
                request.getBusinessName().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Business name is required."
            );
        }

        if (request.getStartingCash() == null) {
            throw new IllegalArgumentException(
                    "Starting cash is required."
            );
        }

        if (request.getStartingCash().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Starting cash cannot be negative."
            );
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "An account with this email already exists."
            );
        }

        User user = new User(
                email,
                passwordEncoder.encode(request.getPassword()),
                request.getBusinessName().trim()
        );

        User savedUser = userRepository.save(user);

        /*
         * Create starting cash settings for this user.
         *
         * Starting cash is entered only during registration.
         */
        CashSettings settings = new CashSettings(
                request.getStartingCash(),
                savedUser
        );

        cashSettingsRepository.save(settings);

        /*
         * Migration:
         *
         * If this is the first account created after the
         * authentication system was added, assign old
         * global financial records to this account.
         */
        assignLegacyDataToFirstUser(savedUser);

        String token = jwtService.generateToken(
                savedUser.getEmail()
        );

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getBusinessName()
        );
    }

    public AuthResponse login(LoginRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Login data is required."
            );
        }

        String email = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Invalid email or password."
                        )
                );

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPassword()
        )) {

            throw new IllegalArgumentException(
                    "Invalid email or password."
            );
        }

        String token = jwtService.generateToken(
                user.getEmail()
        );

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getBusinessName()
        );
    }

    private void assignLegacyDataToFirstUser(User user) {

        var legacyTransactions =
                transactionRepository.findByUserIsNull();

        for (Transaction transaction :
                legacyTransactions) {

            transaction.setUser(user);
        }

        transactionRepository.saveAll(
                legacyTransactions
        );

        var legacyObligations =
                cashObligationRepository.findByUserIsNull();

        for (CashObligation obligation :
                legacyObligations) {

            obligation.setUser(user);
        }

        cashObligationRepository.saveAll(
                legacyObligations
        );

        /*
         * Only migrate an old global CashSettings record
         * if one exists without an owner.
         *
         * Do NOT overwrite the settings created during
         * registration.
         */
        cashSettingsRepository
                .findByUserIsNull()
                .ifPresent(settings -> {

                    /*
                     * If the user already has settings from
                     * registration, keep the registration value.
                     */
                    boolean userAlreadyHasSettings =
                            cashSettingsRepository
                                    .findByUser(user)
                                    .isPresent();

                    if (!userAlreadyHasSettings) {

                        settings.setUser(user);

                        cashSettingsRepository.save(
                                settings
                        );
                    }
                });
    }

    private String normalizeEmail(String email) {

        if (email == null) {
            return null;
        }

        return email
                .trim()
                .toLowerCase();
    }
}