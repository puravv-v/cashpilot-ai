import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCashFlowSummary,
  getCashFlowProjection,
  getCashFlowRisk,
  getAIAnalysis,

  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,

  getObligations,
  createObligation,
  updateObligation,
  markObligationAsDone,
  deleteObligation,
  deleteAllObligations,
} from "../services/api";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import "./dashboard.css";

const INCOME_COLOR = "#16a34a";
const EXPENSE_COLOR = "#dc2626";
const PRIMARY_COLOR = "#2563eb";

function Dashboard({
  token,
  onSessionExpired,
  onLogout,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    startingCash: 0,
    currentCash: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
  });

  const [transactions, setTransactions] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [projection, setProjection] = useState([]);
  const [risk, setRisk] = useState(null);
  const [aiData, setAiData] = useState(null);

  const [saving, setSaving] = useState(false);

  const [editingTransactionId, setEditingTransactionId] =
    useState(null);

  const [editingObligationId, setEditingObligationId] =
    useState(null);

  const [transactionForm, setTransactionForm] =
    useState({
      type: "INCOME",
      amount: "",
      description: "",
      transactionDate: getLocalDateTime(),
    });

  const [obligationForm, setObligationForm] =
    useState({
      type: "EXPENSE",
      amount: "",
      description: "",
      dueDate: getTomorrowDate(),
    });

  useEffect(() => {
    loadDashboard();
  }, []);

  /*
   * =========================================================
   * LOAD DASHBOARD
   * =========================================================
   */

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      /*
       * Summary is loaded first because current cash is used
       * by projection and risk calculations.
       */
      const summaryData =
        await getCashFlowSummary();

      const currentCash = Number(
        summaryData?.currentCash || 0
      );

      const [
        transactionData,
        obligationData,
        projectionData,
        riskData,
      ] = await Promise.all([
        getTransactions(),
        getObligations(),
        getCashFlowProjection(currentCash),
        getCashFlowRisk(currentCash),
      ]);

      const cleanTransactions =
        Array.isArray(transactionData)
          ? transactionData
          : [];

      const cleanObligations =
        Array.isArray(obligationData)
          ? obligationData
          : [];

      const cleanProjection =
        Array.isArray(projectionData)
          ? projectionData
          : projectionData?.value || [];

      const totalIncome = Number(
        summaryData?.totalIncome || 0
      );

      const totalExpenses = Number(
        summaryData?.totalExpenses || 0
      );

      const netCashFlow = Number(
        summaryData?.netCashFlow ??
          totalIncome - totalExpenses
      );

      setSummary({
        startingCash: Number(
          summaryData?.startingCash || 0
        ),
        currentCash,
        totalIncome,
        totalExpenses,
        netCashFlow,
      });

      setTransactions(cleanTransactions);
      setObligations(cleanObligations);
      setProjection(cleanProjection);
      setRisk(riskData);

      /*
       * AI is optional.
       *
       * If AI fails, the financial dashboard still works.
       */
      try {
        const aiResponse = await getAIAnalysis({
          currentCash,
          startingCash: Number(
            summaryData?.startingCash || 0
          ),
          totalIncome,
          totalExpenses,
          projection: cleanProjection,
          risk: riskData,
          recommendations: [],
        });

        setAiData(aiResponse);
      } catch (aiError) {
        console.error(
          "AI analysis failed:",
          aiError?.response?.data || aiError
        );

        setAiData(null);
      }
    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      );

      console.error(
        "Backend response:",
        err?.response?.data
      );

      /*
       * IMPORTANT:
       * Do NOT just display "session expired".
       *
       * App.jsx owns authentication state.
       * Tell App.jsx to remove the token and show Login.
       */
      if (
        err?.response?.status === 401 ||
        err?.response?.status === 403
      ) {
        setError(
          "Your session has expired. Please log in again."
        );

        if (typeof onSessionExpired === "function") {
          onSessionExpired();
        }

        return;
      }

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load CashPilot data."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   *
   * DO NOT use react-router-dom.
   * App.jsx already controls Login/Dashboard rendering.
   */

  function handleLogout() {
    if (typeof onLogout === "function") {
      onLogout();
    }
  }

  /*
   * =========================================================
   * RECORDED TRANSACTIONS
   * =========================================================
   */

  function startTransactionEdit(transaction) {
    setEditingTransactionId(transaction.id);

    setTransactionForm({
      type: transaction.type || "INCOME",
      amount: transaction.amount ?? "",
      description: transaction.description || "",
      transactionDate: toLocalDateTimeInput(
        transaction.transactionDate
      ),
    });

    document
      .getElementById("add-cash-flow-form")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }

  function cancelTransactionEdit() {
    setEditingTransactionId(null);

    setTransactionForm({
      type: "INCOME",
      amount: "",
      description: "",
      transactionDate: getLocalDateTime(),
    });
  }

  async function handleTransactionSubmit(event) {
    event.preventDefault();

    const amount = Number(
      transactionForm.amount
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid transaction amount.");
      return;
    }

    if (!transactionForm.description.trim()) {
      alert("Enter a description.");
      return;
    }

    if (!transactionForm.transactionDate) {
      alert("Select a transaction date.");
      return;
    }

    if (
      transactionForm.transactionDate >
      getLocalDateTime()
    ) {
      alert(
        "Recorded transactions can only be today or in the past."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        amount,
        type: transactionForm.type,
        description:
          transactionForm.description.trim(),
        transactionDate:
          transactionForm.transactionDate,
      };

      if (editingTransactionId) {
        await updateTransaction(
          editingTransactionId,
          payload
        );
      } else {
        await createTransaction(payload);
      }

      cancelTransactionEdit();

      await loadDashboard();
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to save transaction."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleTransactionDelete(id) {
    if (
      !window.confirm(
        "Delete this transaction?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await deleteTransaction(id);

      await loadDashboard();
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Unable to delete transaction."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =========================================================
   * FUTURE CASH FLOWS
   * =========================================================
   */

  function startObligationEdit(obligation) {
    setEditingObligationId(obligation.id);

    setObligationForm({
      type: obligation.type || "EXPENSE",
      amount: obligation.amount ?? "",
      description:
        obligation.description || "",
      dueDate:
        obligation.dueDate ||
        getTomorrowDate(),
    });

    document
      .getElementById("future-cash-flow-form")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }

  function cancelObligationEdit() {
    setEditingObligationId(null);

    setObligationForm({
      type: "EXPENSE",
      amount: "",
      description: "",
      dueDate: getTomorrowDate(),
    });
  }

  async function handleObligationSubmit(event) {
    event.preventDefault();

    const amount = Number(
      obligationForm.amount
    );

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    if (!obligationForm.description.trim()) {
      alert("Enter a description.");
      return;
    }

    if (!obligationForm.dueDate) {
      alert("Select a future date.");
      return;
    }

    if (
      obligationForm.dueDate <=
      getTodayDate()
    ) {
      alert(
        "Future cash flows must have a date after today."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        amount,
        type: obligationForm.type,
        description:
          obligationForm.description.trim(),
        dueDate: obligationForm.dueDate,
      };

      if (editingObligationId) {
        await updateObligation(
          editingObligationId,
          payload
        );
      } else {
        await createObligation(payload);
      }

      cancelObligationEdit();

      await loadDashboard();
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to save future cash flow."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleObligationDone(obligation) {
    const defaultDate = getTodayDate();

    const actualDate = window.prompt(
      `Confirm the actual date for "${obligation.description}".\n\nEnter date as YYYY-MM-DD:`,
      defaultDate
    );

    if (actualDate === null) {
      return;
    }

    const trimmedDate =
      actualDate.trim();

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        trimmedDate
      )
    ) {
      alert(
        "Please enter the date in YYYY-MM-DD format."
      );
      return;
    }

    if (
      trimmedDate >
      getTodayDate()
    ) {
      alert(
        "The completed payment date cannot be in the future."
      );
      return;
    }

    if (
      !window.confirm(
        `Mark "${obligation.description}" as completed on ${trimmedDate}?\n\nIt will move to Recorded Transactions.`
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await markObligationAsDone(
        obligation.id,
        trimmedDate
      );

      await loadDashboard();
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to mark cash flow as completed."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleObligationDelete(id) {
    if (
      !window.confirm(
        "Delete this upcoming cash-flow item?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await deleteObligation(id);

      await loadDashboard();
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Unable to delete upcoming item."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAllObligations() {
    if (!obligations.length) {
      return;
    }

    if (
      !window.confirm(
        "Delete ALL upcoming cash-flow items?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);

      await deleteAllObligations();

      await loadDashboard();
    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
          "Unable to clear upcoming cash flows."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * =========================================================
   * CHART DATA
   * =========================================================
   */

  const projectionChartData = useMemo(() => {
    return [
      {
        date: "Now",
        balance: Number(
          summary.currentCash || 0
        ),
      },

      ...projection.map((item) => ({
        date: formatDate(item.date),
        balance: Number(
          item.cashBalance || 0
        ),
      })),
    ];
  }, [
    projection,
    summary.currentCash,
  ]);

  const pieData = useMemo(() => {
    return [
      {
        name: "Income",
        value: Math.max(
          Number(summary.totalIncome || 0),
          0
        ),
      },
      {
        name: "Expenses",
        value: Math.max(
          Number(summary.totalExpenses || 0),
          0
        ),
      },
    ].filter(
      (item) => item.value > 0
    );
  }, [
    summary.totalIncome,
    summary.totalExpenses,
  ]);

  const pieTotal = useMemo(
    () =>
      pieData.reduce(
        (sum, item) =>
          sum + item.value,
        0
      ),
    [pieData]
  );

  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function formatCurrency(value) {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }

  function formatDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getRiskClass(severity) {
    switch (
      String(
        severity || ""
      ).toUpperCase()
    ) {
      case "CRITICAL":
        return "risk-critical";

      case "HIGH":
      case "WARNING":
        return "risk-warning";

      case "MEDIUM":
        return "risk-medium";

      default:
        return "risk-low";
    }
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner">
          ↻
        </div>

        <h2>
          Loading CashPilot...
        </h2>

        <p>
          Analyzing your cash flow and
          generating insights.
        </p>
      </div>
    );
  }

  /*
   * =========================================================
   * DASHBOARD
   * =========================================================
   */

  return (
    <div className="dashboard">

      {/* HEADER */}

      <header className="dashboard-header">

        <div className="brand">

          <div className="brand-icon">
            ₹
          </div>

          <div>
            <h1>
              CashPilot
            </h1>

            <p>
              AI-powered cash flow intelligence
            </p>
          </div>

        </div>

        <div className="header-actions">

          <button
            className="refresh-button"
            onClick={loadDashboard}
            disabled={saving}
            type="button"
          >
            ↻ Refresh
          </button>

          <button
            className="logout-button"
            onClick={handleLogout}
            type="button"
          >
            ↪ Logout
          </button>

        </div>

      </header>

      {/* ERROR */}

      {error && (
        <div className="error-banner">

          <span>
            {error}
          </span>

          <button
            className="error-login-button"
            onClick={handleLogout}
            type="button"
          >
            Go to Login
          </button>

        </div>
      )}

      {/* STARTING CASH */}

      <section className="starting-cash-card">

        <div>

          <div className="section-eyebrow">
            ACCOUNT BALANCE
          </div>

          <h2>
            Starting Cash
          </h2>

          <p>
            Opening balance used to calculate
            your current cash position.
          </p>

        </div>

        <div className="starting-cash-value">
          {formatCurrency(
            summary.startingCash
          )}
        </div>

      </section>

      {/* ACTUAL CASH FLOW */}

      <section
        id="add-cash-flow-form"
        className="full-management-card"
      >

        <div className="section-eyebrow">
          ADD CASH FLOW
        </div>

        <div className="form-heading-row">

          <div>

            <h2>
              {editingTransactionId
                ? "Edit Cash Flow"
                : "Record Income or Expense"}
            </h2>

            <p>
              Record money that has already
              entered or left the business.
            </p>

          </div>

          {editingTransactionId && (
            <span className="editing-badge">
              Editing transaction
            </span>
          )}

        </div>

        <form
          className="full-entry-form"
          onSubmit={
            handleTransactionSubmit
          }
        >

          <div className="form-field">

            <label>
              Type
            </label>

            <select
              value={
                transactionForm.type
              }
              onChange={(event) =>
                setTransactionForm({
                  ...transactionForm,
                  type:
                    event.target.value,
                })
              }
            >

              <option value="INCOME">
                Income
              </option>

              <option value="EXPENSE">
                Expense
              </option>

            </select>

          </div>

          <div className="form-field">

            <label>
              Amount
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={
                transactionForm.amount
              }
              onChange={(event) =>
                setTransactionForm({
                  ...transactionForm,
                  amount:
                    event.target.value,
                })
              }
              placeholder="₹ Amount"
            />

          </div>

          <div className="form-field form-field-wide">

            <label>
              Description
            </label>

            <input
              type="text"
              value={
                transactionForm.description
              }
              onChange={(event) =>
                setTransactionForm({
                  ...transactionForm,
                  description:
                    event.target.value,
                })
              }
              placeholder="e.g. Customer payment, fuel purchase"
            />

          </div>

          <div className="form-field">

            <label>
              Date & Time
            </label>

            <input
              type="datetime-local"
              max={getLocalDateTime()}
              value={
                transactionForm.transactionDate
              }
              onChange={(event) =>
                setTransactionForm({
                  ...transactionForm,
                  transactionDate:
                    event.target.value,
                })
              }
            />

          </div>

          <div className="form-submit-area">

            <button
              className="primary-button"
              type="submit"
              disabled={saving}
            >
              {editingTransactionId
                ? "Update Cash Flow"
                : "Add Cash Flow"}
            </button>

            {editingTransactionId && (
              <button
                type="button"
                className="secondary-button"
                onClick={
                  cancelTransactionEdit
                }
                disabled={saving}
              >
                Cancel
              </button>
            )}

          </div>

        </form>

      </section>

      {/* SUMMARY */}

      <section className="summary-grid">

        <SummaryCard
          title="Current Cash"
          value={
            summary.currentCash
          }
          subtitle="Starting cash + actual net flow"
          primary
        />

        <SummaryCard
          title="Starting Cash"
          value={
            summary.startingCash
          }
          subtitle="Opening balance"
        />

        <SummaryCard
          title="Total Income"
          value={
            summary.totalIncome
          }
          subtitle="Recorded income"
          positive
        />

        <SummaryCard
          title="Total Expenses"
          value={
            summary.totalExpenses
          }
          subtitle="Recorded expenses"
          negative
        />

        <SummaryCard
          title="Net Cash Flow"
          value={
            summary.netCashFlow
          }
          subtitle="Income minus expenses"
        />

      </section>

      {/* CHARTS */}

      <section className="charts-grid">

        {/* CASH FLOW PROJECTION */}

        <div className="chart-card">

          <div className="card-header">

            <div>

              <div className="section-eyebrow">
                FORECAST
              </div>

              <h2>
                Cash Flow Projection
              </h2>

              <p>
                Current cash followed by
                future income and expenses
              </p>

            </div>

          </div>

          <div className="chart-container">

            {projectionChartData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={
                    projectionChartData
                  }
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="date"
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 12,
                    }}
                    tickFormatter={(value) =>
                      `₹${(
                        Number(value) / 1000
                      ).toLocaleString(
                        "en-IN"
                      )}k`
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Projected Balance"
                    stroke={
                      PRIMARY_COLOR
                    }
                    strokeWidth={4}
                    dot={{
                      r: 5,
                      strokeWidth: 2,
                      fill: "#ffffff",
                    }}
                    activeDot={{
                      r: 7,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            ) : (

              <EmptyChart
                text="No future cash-flow projection available."
              />

            )}

          </div>

        </div>

        {/* PIE CHART */}

        <div className="chart-card">

          <div className="card-header">

            <div>

              <div className="section-eyebrow">
                BREAKDOWN
              </div>

              <h2>
                Income vs Expenses
              </h2>

              <p>
                Actual recorded transactions
              </p>

            </div>

          </div>

          <div className="pie-container">

            {pieData.length > 0 ? (

              <>

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={115}
                      innerRadius={68}
                      paddingAngle={
                        pieData.length > 1
                          ? 5
                          : 0
                      }
                      stroke="#ffffff"
                      strokeWidth={3}
                    >

                      {pieData.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.name ===
                              "Income"
                                ? INCOME_COLOR
                                : EXPENSE_COLOR
                            }
                          />
                        )
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        formatCurrency(value)
                      }
                    />

                    <Legend
                      verticalAlign="bottom"
                      height={36}
                    />

                  </PieChart>

                </ResponsiveContainer>

                <div className="pie-center">

                  <span>
                    Total
                  </span>

                  <strong>
                    {formatCurrency(
                      pieTotal
                    )}
                  </strong>

                </div>

              </>

            ) : (

              <div className="empty-chart">

                <strong>
                  No transactions yet
                </strong>

                <span>
                  Add an income or expense
                  above to populate this chart.
                </span>

              </div>

            )}

          </div>

        </div>

      </section>

      {/* FINANCIAL HEALTH */}

      {risk && (
        <section className="risk-section">

          <div className="section-eyebrow">
            FINANCIAL HEALTH
          </div>

          <h2>
            Cash Flow Risk
          </h2>

          <div
            className={`risk-card ${getRiskClass(
              risk.severity
            )}`}
          >

            <div>

              <span className="risk-badge">
                {risk.severity ||
                  "LOW"}
              </span>

              <h3>
                {risk.message ||
                  "No significant cash-flow risk detected."}
              </h3>

              {risk.primaryCause && (
                <p>
                  Primary cause:{" "}
                  <strong>
                    {risk.primaryCause}
                  </strong>
                </p>
              )}

            </div>

            <div className="risk-stat">

              <span>
                Projected balance
              </span>

              <strong>
                {formatCurrency(
                  risk.projectedBalance
                )}
              </strong>

            </div>

          </div>

        </section>
      )}

      {/* RECORDED TRANSACTIONS */}

      <section className="section">

        <div className="section-heading">

          <div>

            <div className="section-eyebrow">
              RECORDED TRANSACTIONS
            </div>

            <h2>
              Transaction History
            </h2>

            <p>
              Income and expenses that have
              already happened
            </p>

          </div>

        </div>

        <div className="transaction-list">

          {transactions.length === 0 ? (

            <div className="empty-list">
              No transactions recorded yet.
            </div>

          ) : (

            transactions
              .slice()
              .sort(
                (a, b) =>
                  new Date(
                    b.transactionDate
                  ) -
                  new Date(
                    a.transactionDate
                  )
              )
              .map((transaction) => {

                const income =
                  transaction.type ===
                  "INCOME";

                return (
                  <div
                    className="transaction-row"
                    key={transaction.id}
                  >

                    <div className="transaction-main">

                      <strong>
                        {
                          transaction.description
                        }
                      </strong>

                      <span>
                        {income
                          ? "Income"
                          : "Expense"}

                        {" • "}

                        {formatDate(
                          transaction.transactionDate
                        )}
                      </span>

                    </div>

                    <strong
                      className={
                        income
                          ? "amount-positive"
                          : "amount-negative"
                      }
                    >
                      {income
                        ? "+"
                        : "-"}

                      {formatCurrency(
                        transaction.amount
                      )}
                    </strong>

                    <div className="row-actions">

                      <button
                        className="secondary-button small"
                        onClick={() =>
                          startTransactionEdit(
                            transaction
                          )
                        }
                        disabled={saving}
                        type="button"
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button small"
                        onClick={() =>
                          handleTransactionDelete(
                            transaction.id
                          )
                        }
                        disabled={saving}
                        type="button"
                      >
                        Delete
                      </button>

                    </div>

                  </div>
                );
              })

          )}

        </div>

      </section>

      {/* FUTURE CASH FLOWS */}

      <section className="section">

        <div className="section-heading">

          <div>

            <div className="section-eyebrow">
              UPCOMING EVENTS
            </div>

            <h2>
              Cash Flow Timeline
            </h2>

            <p>
              Future income and expenses affecting
              projected balance
            </p>

          </div>

          {obligations.length > 0 && (
            <button
              className="danger-outline"
              onClick={
                handleDeleteAllObligations
              }
              disabled={saving}
              type="button"
            >
              Clear All
            </button>
          )}

        </div>

        {/* FUTURE ENTRY TILE */}

        <div
          id="future-cash-flow-form"
          className="full-management-card future-form-card"
        >

          <div className="section-eyebrow">
            FUTURE CASH FLOW
          </div>

          <div className="form-heading-row">

            <div>

              <h2>
                {editingObligationId
                  ? "Edit Future Cash Flow"
                  : "Add Future Cash Flow"}
              </h2>

              <p>
                Add expected income or expenses
                so CashPilot can project your
                future cash position.
              </p>

            </div>

            {editingObligationId && (
              <span className="editing-badge">
                Editing future cash flow
              </span>
            )}

          </div>

          <form
            className="full-entry-form"
            onSubmit={
              handleObligationSubmit
            }
          >

            <div className="form-field">

              <label>
                Type
              </label>

              <select
                value={
                  obligationForm.type
                }
                onChange={(event) =>
                  setObligationForm({
                    ...obligationForm,
                    type:
                      event.target.value,
                  })
                }
              >

                <option value="EXPENSE">
                  Future Expense
                </option>

                <option value="INCOME">
                  Future Income
                </option>

              </select>

            </div>

            <div className="form-field">

              <label>
                Amount
              </label>

              <input
                type="number"
                min="0.01"
                step="0.01"
                value={
                  obligationForm.amount
                }
                onChange={(event) =>
                  setObligationForm({
                    ...obligationForm,
                    amount:
                      event.target.value,
                  })
                }
                placeholder="₹ Amount"
              />

            </div>

            <div className="form-field form-field-wide">

              <label>
                Description
              </label>

              <input
                type="text"
                value={
                  obligationForm.description
                }
                onChange={(event) =>
                  setObligationForm({
                    ...obligationForm,
                    description:
                      event.target.value,
                  })
                }
                placeholder="e.g. AWS bill, customer payment"
              />

            </div>

            <div className="form-field">

              <label>
                Due Date
              </label>

              <input
                type="date"
                min={getTomorrowDate()}
                value={
                  obligationForm.dueDate
                }
                onChange={(event) =>
                  setObligationForm({
                    ...obligationForm,
                    dueDate:
                      event.target.value,
                  })
                }
              />

            </div>

            <div className="form-submit-area">

              <button
                className="primary-button"
                type="submit"
                disabled={saving}
              >
                {editingObligationId
                  ? "Update Future Flow"
                  : "Add Future Flow"}
              </button>

              {editingObligationId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    cancelObligationEdit
                  }
                  disabled={saving}
                >
                  Cancel
                </button>
              )}

            </div>

          </form>

        </div>

        {/* TIMELINE */}

        <div className="timeline-card">

          {obligations.length === 0 ? (

            <div className="empty-list">
              No upcoming cash flows.
            </div>

          ) : (

            obligations
              .slice()
              .sort(
                (a, b) =>
                  new Date(a.dueDate) -
                  new Date(b.dueDate)
              )
              .map((obligation) => {

                const positive =
                  obligation.type ===
                  "INCOME";

                const projectionItem =
                  projection.find(
                    (item) =>
                      String(
                        item.date
                      ) ===
                        String(
                          obligation.dueDate
                        ) &&
                      item.description ===
                        obligation.description
                  );

                const projectedBalance =
                  projectionItem
                    ?.cashBalance;

                return (
                  <div
                    className="timeline-item"
                    key={obligation.id}
                  >

                    <div className="timeline-date">
                      {formatDate(
                        obligation.dueDate
                      )}
                    </div>

                    <div
                      className={`timeline-dot ${
                        positive
                          ? "positive"
                          : "negative"
                      }`}
                    />

                    <div className="timeline-content">

                      <div className="timeline-info">

                        <div className="timeline-type">
                          {positive
                            ? "UPCOMING INCOME"
                            : "UPCOMING EXPENSE"}
                        </div>

                        <h3>
                          {
                            obligation.description
                          }
                        </h3>

                      </div>

                      <div className="timeline-amount">

                        <strong
                          className={
                            positive
                              ? "amount-positive"
                              : "amount-negative"
                          }
                        >
                          {positive
                            ? "+"
                            : "-"}

                          {formatCurrency(
                            obligation.amount
                          )}
                        </strong>

                        {projectedBalance !==
                          undefined && (
                          <span>
                            Projected balance:{" "}
                            {formatCurrency(
                              projectedBalance
                            )}
                          </span>
                        )}

                        <div className="row-actions">

                          <button
                            className="secondary-button small"
                            onClick={() =>
                              startObligationEdit(
                                obligation
                              )
                            }
                            disabled={saving}
                            type="button"
                          >
                            Edit
                          </button>

                          <button
                            className="complete-button"
                            onClick={() =>
                              handleObligationDone(
                                obligation
                              )
                            }
                            disabled={saving}
                            type="button"
                          >
                            ✓ Mark as Done
                          </button>

                          <button
                            className="delete-button small"
                            onClick={() =>
                              handleObligationDelete(
                                obligation.id
                              )
                            }
                            disabled={saving}
                            type="button"
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    </div>

                  </div>
                );
              })

          )}

        </div>

      </section>

      {/* =====================================================
          AI FINANCIAL INTELLIGENCE
          NO RECOMMENDED ACTIONS
          ===================================================== */}

      {aiData && (
        <section className="ai-section">

          <div className="ai-header">

            <div className="ai-title-area">

              <div className="ai-logo">
                ✦
              </div>

              <div>

                <div className="ai-eyebrow">
                  POWERED BY CASHPILOT AI
                </div>

                <h2>
                  AI Financial Intelligence
                </h2>

                <p>
                  Your business cash flow,
                  interpreted by AI
                </p>

              </div>

            </div>

            <span className="ai-badge">
              AI INSIGHT
            </span>

          </div>

          {/* LARGE EXECUTIVE SUMMARY */}

          <div className="ai-summary-main">

            <div className="ai-summary-label">
              EXECUTIVE SUMMARY
            </div>

            <h3>
              What's happening?
            </h3>

            <p>
              {aiData.summary ||
                "No AI summary is available yet."}
            </p>

          </div>

          {/* AI DETAIL GRID */}

          <div className="ai-grid">

            <AIBox
              label="CASH FLOW RISK"
              title="Where are you exposed?"
              text={
                aiData.riskExplanation
              }
              icon="!"
            />

            <AIBox
              label="PRIORITY"
              title="What matters most?"
              text={
                aiData.priorityAction
              }
              icon="→"
              priority
            />

            <AIBox
              label="FORWARD OUTLOOK"
              title="What happens next?"
              text={
                aiData.outlook
              }
              icon="↗"
            />

            <AIBox
              label="BUSINESS PATTERN"
              title="What pattern do you see?"
              text={
                aiData.businessPattern
              }
              icon="◌"
            />

            <AIBox
              label="GOOD SCENARIO"
              title="What could go right?"
              text={
                aiData.goodScenario
              }
              icon="✓"
            />

            <AIBox
              label="BAD SCENARIO"
              title="What could go wrong?"
              text={
                aiData.badScenario
              }
              icon="!"
            />

          </div>

          {/* AI DATA CONTEXT */}

          <div className="ai-context">

            <div>
              <span>
                Current cash
              </span>

              <strong>
                {formatCurrency(
                  summary.currentCash
                )}
              </strong>
            </div>

            <div>
              <span>
                Future cash flows
              </span>

              <strong>
                {obligations.length}
              </strong>
            </div>

            <div>
              <span>
                Projected events
              </span>

              <strong>
                {projection.length}
              </strong>
            </div>

            <div>
              <span>
                Cash-flow risk
              </span>

              <strong>
                {risk?.severity ||
                  "LOW"}
              </strong>
            </div>

          </div>

        </section>
      )}

      {/* FOOTER */}

      <footer className="dashboard-footer">

        <strong>
          CashPilot
        </strong>

        <span>
          AI-powered financial intelligence
        </span>

      </footer>

    </div>
  );
}

/*
 * =========================================================
 * SUMMARY CARD
 * =========================================================
 */

function SummaryCard({
  title,
  value,
  subtitle,
  primary = false,
  positive = false,
  negative = false,
}) {
  let modifier = "";

  if (positive) {
    modifier = "positive";
  }

  if (negative) {
    modifier = "negative";
  }

  return (
    <div
      className={`summary-card ${
        primary ? "primary" : ""
      } ${modifier}`}
    >

      <span className="summary-label">
        {title}
      </span>

      <strong className="summary-value">
        ₹
        {Number(
          value || 0
        ).toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })}
      </strong>

      <span className="summary-subtitle">
        {subtitle}
      </span>

    </div>
  );
}

/*
 * =========================================================
 * EMPTY CHART
 * =========================================================
 */

function EmptyChart({ text }) {
  return (
    <div className="empty-chart">
      {text}
    </div>
  );
}

/*
 * =========================================================
 * AI BOX
 * =========================================================
 */

function AIBox({
  label,
  title,
  text,
  icon,
  priority = false,
}) {
  return (
    <div
      className={`ai-card ${
        priority
          ? "ai-card-priority"
          : ""
      }`}
    >

      <div className="ai-card-icon">
        {icon}
      </div>

      <div>

        <span className="ai-card-label">
          {label}
        </span>

        <h3>
          {title}
        </h3>

        <p>
          {text ||
            "No AI analysis available."}
        </p>

      </div>

    </div>
  );
}

/*
 * =========================================================
 * DATE HELPERS
 * =========================================================
 */

function getLocalDateTime() {
  const now = new Date();

  const offset =
    now.getTimezoneOffset();

  const local = new Date(
    now.getTime() -
      offset * 60 * 1000
  );

  return local
    .toISOString()
    .slice(0, 16);
}

function getTodayDate() {
  const now = new Date();

  const offset =
    now.getTimezoneOffset();

  const local = new Date(
    now.getTime() -
      offset * 60 * 1000
  );

  return local
    .toISOString()
    .slice(0, 10);
}

function getTomorrowDate() {
  const now = new Date();

  now.setDate(
    now.getDate() + 1
  );

  const offset =
    now.getTimezoneOffset();

  const local = new Date(
    now.getTime() -
      offset * 60 * 1000
  );

  return local
    .toISOString()
    .slice(0, 10);
}

function toLocalDateTimeInput(value) {
  if (!value) {
    return getLocalDateTime();
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return getLocalDateTime();
  }

  const offset =
    date.getTimezoneOffset();

  const local = new Date(
    date.getTime() -
      offset * 60 * 1000
  );

  return local
    .toISOString()
    .slice(0, 16);
}

export default Dashboard;