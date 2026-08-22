package com.cashpilot.backend.service;

import com.cashpilot.backend.dto.AuthResponse;
import com.cashpilot.backend.dto.LoginRequest;
import com.cashpilot.backend.dto.RegisterRequest;
import com.cashpilot.backend.entity.User;
import com.cashpilot.backend.repository.UserRepository;
import com.cashpilot.backend.security.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public AuthResponse register(
            RegisterRequest request
    ) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Registration data is required."
            );
        }

        String email =
                normalizeEmail(request.getEmail());

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

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "An account with this email already exists."
            );
        }

        User user =
                new User(
                        email,
                        passwordEncoder.encode(
                                request.getPassword()
                        ),
                        request.getBusinessName().trim()
                );

        User savedUser =
                userRepository.save(user);

        String token =
                jwtService.generateToken(
                        savedUser.getEmail()
                );

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getBusinessName()
        );
    }

    public AuthResponse login(
            LoginRequest request
    ) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Login data is required."
            );
        }

        String email =
                normalizeEmail(request.getEmail());

        User user =
                userRepository.findByEmail(email)
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

        String token =
                jwtService.generateToken(
                        user.getEmail()
                );

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getBusinessName()
        );
    }

    private String normalizeEmail(String email) {

        if (email == null) {
            return null;
        }

        return email.trim().toLowerCase();
    }
}