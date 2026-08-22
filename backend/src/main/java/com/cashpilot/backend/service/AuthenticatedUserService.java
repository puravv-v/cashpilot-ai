package com.cashpilot.backend.service;

import com.cashpilot.backend.entity.User;
import com.cashpilot.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticatedUserService {

    private final UserRepository userRepository;

    public AuthenticatedUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated() ||
                authentication.getName() == null) {

            throw new IllegalStateException(
                    "No authenticated user found."
            );
        }

        return userRepository.findByEmail(
                authentication.getName()
        ).orElseThrow(() ->
                new IllegalStateException(
                        "Authenticated user no longer exists."
                )
        );
    }
}