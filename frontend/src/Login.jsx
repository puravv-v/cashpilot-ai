import "./Login.css";

import { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8080/api";

function Login({
  onLogin,
  onGoToRegister,
}) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const response =
        await axios.post(
          `${API_URL}/auth/login`,
          {
            email: email.trim(),
            password,
          }
        );

      const token =
        response.data?.token;

      if (!token) {
        throw new Error(
          "Login succeeded but no token was returned."
        );
      }

      onLogin(token);

    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Invalid email or password."
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

          <h1>CashPilot</h1>

          <p>
            AI-powered cash flow intelligence
          </p>
        </div>

        <div className="auth-heading">
          <h2>
            Welcome back
          </h2>

          <p>
            Sign in to manage your
            business cash flow.
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
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit"
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>

        <div className="auth-switch">

          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={
              onGoToRegister
            }
          >
            Create account
          </button>

        </div>

      </div>
    </div>
  );
}

export default Login;