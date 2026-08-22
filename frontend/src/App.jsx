import React, { useState } from "react";

import Dashboard from "./pages/Dashboard";
import Login from "./Login";
import Register from "./Register";

function App() {
  const [token, setToken] = useState(() => {
    return (
      localStorage.getItem("cashpilot_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("jwtToken") ||
      localStorage.getItem("accessToken") ||
      null
    );
  });

  const [showRegister, setShowRegister] = useState(false);

  /*
  =========================================================
  LOGIN / REGISTER SUCCESS
  =========================================================
  */

  function handleLogin(newToken) {
    let actualToken = newToken;

    /*
     * Support both:
     *
     * onLogin("eyJ...")
     *
     * and:
     *
     * onLogin({ token: "eyJ..." })
     */

    if (
      typeof newToken === "object" &&
      newToken !== null
    ) {
      actualToken =
        newToken.token ||
        newToken.jwt ||
        newToken.jwtToken ||
        newToken.accessToken ||
        newToken.data?.token ||
        newToken.data?.accessToken;
    }

    if (!actualToken) {
      console.error(
        "Login did not return a JWT token.",
        newToken
      );
      return;
    }

    /*
     * Store the token under the main CashPilot key.
     */

    localStorage.setItem(
      "cashpilot_token",
      actualToken
    );

    /*
     * Also keep compatibility with any older frontend
     * code that may still look for these keys.
     */

    localStorage.setItem(
      "token",
      actualToken
    );

    localStorage.setItem(
      "jwtToken",
      actualToken
    );

    localStorage.removeItem(
      "cashpilot_session_expired"
    );

    setToken(actualToken);
    setShowRegister(false);
  }

  /*
  =========================================================
  LOGOUT
  =========================================================
  */

  function handleLogout() {
    const tokenKeys = [
      "cashpilot_token",
      "token",
      "jwt",
      "jwtToken",
      "accessToken",
      "authToken",
      "cashpilot_session_expired",
    ];

    tokenKeys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    setToken(null);
    setShowRegister(false);
  }

  /*
  =========================================================
  SESSION EXPIRED
  =========================================================
  */

  function handleSessionExpired() {
    const tokenKeys = [
      "cashpilot_token",
      "token",
      "jwt",
      "jwtToken",
      "accessToken",
      "authToken",
    ];

    tokenKeys.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    localStorage.setItem(
      "cashpilot_session_expired",
      "true"
    );

    setToken(null);
    setShowRegister(false);
  }

  /*
  =========================================================
  NOT LOGGED IN
  =========================================================
  */

  if (!token) {
    if (showRegister) {
      return (
        <Register
          onRegistered={handleLogin}
          onGoToLogin={() => setShowRegister(false)}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onGoToRegister={() => setShowRegister(true)}
      />
    );
  }

  /*
  =========================================================
  LOGGED IN
  =========================================================
  */

  return (
    <div
      style={{
        minHeight: "100vh",
      }}
    >
      <Dashboard
        key={token}
        token={token}
        onSessionExpired={handleSessionExpired}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;