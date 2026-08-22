import "./Register.css";

import { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8080/api";

function Register({
  onRegistered,
  onGoToLogin,
}) {
  const [businessName, setBusinessName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [startingCash, setStartingCash] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!businessName.trim()) {
      setError(
        "Please enter your business name."
      );
      return;
    }

    if (!email.trim()) {
      setError(
        "Please enter your email."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter a password."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    if (startingCash === "") {
      setError(
        "Please enter your starting cash."
      );
      return;
    }

    const cash = Number(startingCash);

    if (
      !Number.isFinite(cash) ||
      cash < 0
    ) {
      setError(
        "Please enter a valid starting cash amount."
      );
      return;
    }

    try {
      setLoading(true);

      /*
       * Registration backend expects startingCash
       * as part of RegisterRequest.
       *
       * The backend itself creates CashSettings,
       * so we DO NOT make a second starting-cash
       * request here.
       */
      const response =
        await axios.post(
          `${API_URL}/auth/register`,
          {
            businessName:
              businessName.trim(),

            email:
              email.trim(),

            password,

            startingCash: cash,
          }
        );

      const token =
        response.data?.token;

      if (!token) {
        throw new Error(
          "Registration succeeded but no token was returned."
        );
      }

      /*
       * Keep the token for the current
       * authenticated session.
       */
      localStorage.setItem(
        "cashpilot_token",
        token
      );

      /*
       * Keep this only for compatibility
       * with any existing frontend code.
       */
      localStorage.setItem(
        "cashpilot_starting_cash",
        String(cash)
      );

      /*
       * Open dashboard.
       */
      onRegistered(token);

    } catch (err) {
      console.error(
        "Registration error:",
        err
      );

      /*
       * Show the actual backend error
       * whenever Spring returns one.
       */
      const backendMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error;

      setError(
        backendMessage ||
        "Unable to create your account."
      );

    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-brand">

          <div className="auth-logo">
            ₹
          </div>

          <h1>
            CashPilot
          </h1>

          <p>
            AI-powered cash flow intelligence
          </p>

        </div>

        <div className="auth-heading">

          <h2>
            Create your account
          </h2>

          <p>
            Set up your business and
            starting cash once.
          </p>

        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >

          <div className="auth-field">

            <label>
              Business Name
            </label>

            <input
              type="text"
              value={businessName}
              onChange={(event) =>
                setBusinessName(
                  event.target.value
                )
              }
              placeholder="Your business name"
              autoComplete="organization"
            />

          </div>

          <div className="auth-field">

            <label>
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="you@example.com"
              autoComplete="email"
            />

          </div>

          <div className="auth-field">

            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />

          </div>

          <div className="auth-field">

            <label>
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Enter password again"
              autoComplete="new-password"
            />

          </div>

          <div className="auth-field">

            <label>
              Starting Cash
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={startingCash}
              onChange={(event) =>
                setStartingCash(
                  event.target.value
                )
              }
              placeholder="₹0"
            />

            <small>
              Enter the cash available
              when you start using CashPilot.
            </small>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit"
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>

        </form>

        <div className="auth-switch">

          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={onGoToLogin}
          >
            Sign in
          </button>

        </div>

      </div>
    </div>
  );
}

export default Register;