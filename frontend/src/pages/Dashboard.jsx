import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCashFlowSummary,
  getCashFlowProjection,
  getCashFlowRisk,
  getRecommendations,
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
  updateStartingCash,
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

import "./Dashboard.css";

function Dashboard() {

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    startingCash: 0,
    currentCash: 0,
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
  });

  const [transactions, setTransactions] =
    useState([]);

  const [obligations, setObligations] =
    useState([]);

  const [projection, setProjection] =
    useState([]);

  const [risk, setRisk] = useState(null);

  const [recommendations, setRecommendations] =
    useState([]);

  const [aiData, setAiData] = useState(null);

  const [saving, setSaving] =
    useState(false);

  const [startingCashInput, setStartingCashInput] =
    useState("");

  const [editingTransactionId, setEditingTransactionId] =
    useState(null);

  const [editingObligationId, setEditingObligationId] =
    useState(null);

  const [transactionForm, setTransactionForm] =
    useState({
      amount: "",
      type: "INCOME",
      description: "",
      transactionDate: getLocalDateTime(),
    });

  const [obligationForm, setObligationForm] =
    useState({
      amount: "",
      type: "EXPENSE",
      description: "",
      dueDate: getTomorrowDate(),
    });

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =====================================================
     LOAD DASHBOARD
     ===================================================== */

  async function loadDashboard() {

    try {

      setLoading(true);
      setError("");

      /*
       * Summary must be loaded first because projection,
       * risk and recommendations depend on CURRENT CASH.
       */
      const summaryData =
        await getCashFlowSummary();

      const currentCash =
        Number(
          summaryData?.currentCash || 0
        );

      const [
        transactionData,
        obligationData,
        projectionData,
        riskData,
        recommendationData,
      ] = await Promise.all([
        getTransactions(),
        getObligations(),
        getCashFlowProjection(
          currentCash
        ),
        getCashFlowRisk(
          currentCash
        ),
        getRecommendations(
          currentCash
        ),
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
          : [];

      const cleanRecommendations =
        Array.isArray(recommendationData)
          ? recommendationData
          : [];

      setSummary({
        startingCash: Number(
          summaryData?.startingCash || 0
        ),
        currentCash,
        totalIncome: Number(
          summaryData?.totalIncome || 0
        ),
        totalExpenses: Number(
          summaryData?.totalExpenses || 0
        ),
        netCashFlow: Number(
          summaryData?.netCashFlow || 0
        ),
      });

      setStartingCashInput(
        summaryData?.startingCash ?? ""
      );

      setTransactions(
        cleanTransactions
      );

      setObligations(
        cleanObligations
      );

      setProjection(
        cleanProjection
      );

      setRisk(riskData);

      setRecommendations(
        cleanRecommendations
      );

      /*
       * AI is optional. If it fails, the rest of the
       * dashboard still works.
       */
      try {

        const aiResponse =
          await getAIAnalysis({
            currentCash,
            startingCash: Number(
              summaryData?.startingCash || 0
            ),
            totalIncome: Number(
              summaryData?.totalIncome || 0
            ),
            totalExpenses: Number(
              summaryData?.totalExpenses || 0
            ),
            projection:
              cleanProjection,
            risk: riskData,
            recommendations:
              cleanRecommendations,
          });

        setAiData(aiResponse);

      } catch (aiError) {

        console.error(
          "AI analysis failed:",
          aiError
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

      setError(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to load CashPilot data."
      );

    } finally {

      setLoading(false);
    }
  }

  /* =====================================================
     STARTING CASH
     ===================================================== */

  async function handleStartingCashSubmit(
    event
  ) {

    event.preventDefault();

    const amount =
      Number(startingCashInput);

    if (
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      alert(
        "Enter a valid starting cash amount."
      );
      return;
    }

    try {

      setSaving(true);

      await updateStartingCash(
        amount
      );

      await loadDashboard();

    } catch (err) {

      console.error(err);

      alert(
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Unable to update starting cash."
      );

    } finally {

      setSaving(false);
    }
  }

  /* =====================================================
     TRANSACTIONS
     ===================================================== */

  function startTransactionEdit(
    transaction
  ) {

    setEditingTransactionId(
      transaction.id
    );

    setTransactionForm({
      amount:
        transaction.amount ?? "",
      type:
        transaction.type || "INCOME",
      description:
        transaction.description || "",
      transactionDate:
        toLocalDateTimeInput(
          transaction.transactionDate
        ),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function cancelTransactionEdit() {

    setEditingTransactionId(null);

    setTransactionForm({
      amount: "",
      type: "INCOME",
      description: "",
      transactionDate:
        getLocalDateTime(),
    });
  }

  async function handleTransactionSubmit(
    event
  ) {

    event.preventDefault();

    const amount =
      Number(transactionForm.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert(
        "Enter a valid transaction amount."
      );
      return;
    }

    if (
      !transactionForm.description.trim()
    ) {
      alert(
        "Enter a description."
      );
      return;
    }

    if (
      !transactionForm.transactionDate
    ) {
      alert(
        "Select a transaction date."
      );
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
        type:
          transactionForm.type,
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

        await createTransaction(
          payload
        );
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

  async function handleTransactionDelete(
    id
  ) {

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
        "Unable to delete transaction."
      );

    } finally {

      setSaving(false);
    }
  }

  /* =====================================================
     FUTURE CASH FLOWS
     ===================================================== */

  function startObligationEdit(
    obligation
  ) {

    setEditingObligationId(
      obligation.id
    );

    setObligationForm({
      amount:
        obligation.amount ?? "",
      type:
        obligation.type || "EXPENSE",
      description:
        obligation.description || "",
      dueDate:
        obligation.dueDate || getTomorrowDate(),
    });

    const element =
      document.getElementById(
        "future-cash-flow-form"
      );

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }

  function cancelObligationEdit() {

    setEditingObligationId(null);

    setObligationForm({
      amount: "",
      type: "EXPENSE",
      description: "",
      dueDate: getTomorrowDate(),
    });
  }

  async function handleObligationSubmit(
    event
  ) {

    event.preventDefault();

    const amount =
      Number(obligationForm.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert(
        "Enter a valid amount."
      );
      return;
    }

    if (
      !obligationForm.description.trim()
    ) {
      alert(
        "Enter a description."
      );
      return;
    }

    if (
      !obligationForm.dueDate
    ) {
      alert(
        "Select a future date."
      );
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
        type:
          obligationForm.type,
        description:
          obligationForm.description.trim(),
        dueDate:
          obligationForm.dueDate,
      };

      if (editingObligationId) {

        await updateObligation(
          editingObligationId,
          payload
        );

      } else {

        await createObligation(
          payload
        );
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

  async function handleObligationDelete(
    id
  ) {

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
        "Unable to delete upcoming item."
      );

    } finally {

      setSaving(false);
    }
  }

  async function handleObligationDone(
    obligation
  ) {

    /*
     * The user confirms the actual date.
     * Default = today.
     */
    const defaultDate =
      getTodayDate();

    const actualDate =
      window.prompt(
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
        `Mark "${obligation.description}" as completed on ${trimmedDate}?\n\nIt will move from Upcoming Events to Recorded Transactions.`
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
        "Unable to clear upcoming cash flows."
      );

    } finally {

      setSaving(false);
    }
  }

  /* =====================================================
     CHART DATA
     ===================================================== */

  const projectionChartData =
    useMemo(() => {

      const currentPoint = {
        date: "Now",
        balance:
          Number(
            summary.currentCash || 0
          ),
      };

      const futurePoints =
        projection.map(
          (item) => ({
            date:
              formatDate(item.date),
            balance:
              Number(
                item.cashBalance || 0
              ),
          })
        );

      return [
        currentPoint,
        ...futurePoints,
      ];

    }, [
      projection,
      summary.currentCash,
    ]);

  const pieData =
    useMemo(() => {

      const income =
        Number(
          summary.totalIncome || 0
        );

      const expenses =
        Number(
          summary.totalExpenses || 0
        );

      return [
        {
          name: "Income",
          value: income,
        },
        {
          name: "Expenses",
          value: expenses,
        },
      ].filter(
        (item) => item.value > 0
      );

    }, [
      summary.totalIncome,
      summary.totalExpenses,
    ]);

  /* =====================================================
     HELPERS
     ===================================================== */

  function formatCurrency(value) {

    return `₹${Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function formatDate(value) {

    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
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

  function formatDateTime(value) {

    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
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

  function getRiskClass(
    severity
  ) {

    switch (
      String(
        severity || ""
      ).toUpperCase()
    ) {

      case "CRITICAL":
        return "risk-critical";

      case "WARNING":
        return "risk-warning";

      default:
        return "risk-low";
    }
  }

  /* =====================================================
     LOADING
     ===================================================== */

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
          Loading your actual financial data.
        </p>

      </div>
    );
  }

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

        <button
          className="refresh-button"
          onClick={loadDashboard}
          disabled={saving}
        >
          ↻ Refresh
        </button>

      </header>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {/* =====================================================
          ACCOUNT + ACTUAL TRANSACTION
          ===================================================== */}

      <section className="management-grid">

        {/* STARTING CASH */}

        <div className="management-card">

          <div className="section-eyebrow">
            ACCOUNT SETUP
          </div>

          <h2>
            Starting Cash
          </h2>

          <p>
            Enter the cash available before
            recorded transactions.
          </p>

          <form
            className="inline-form"
            onSubmit={
              handleStartingCashSubmit
            }
          >

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                startingCashInput
              }
              onChange={(event) =>
                setStartingCashInput(
                  event.target.value
                )
              }
              placeholder="Starting cash"
            />

            <button
              type="submit"
              disabled={saving}
            >
              Save
            </button>

          </form>

        </div>

        {/* ACTUAL TRANSACTION */}

        <div className="management-card">

          <div className="section-eyebrow">
            ADD CASH FLOW
          </div>

          <h2>
            {editingTransactionId
              ? "Edit Transaction"
              : "Record Income or Expense"}
          </h2>

          <p>
            Only transactions that have already
            happened can be recorded here.
          </p>

          <form
            className="entry-form"
            onSubmit={
              handleTransactionSubmit
            }
          >

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
              placeholder="Amount"
            />

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
              placeholder="Description"
            />

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

            <button
              type="submit"
              disabled={saving}
            >
              {editingTransactionId
                ? "Update"
                : "Add"}
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

          </form>

        </div>

      </section>

      {/* =====================================================
          SUMMARY
          ===================================================== */}

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
        />

        <SummaryCard
          title="Total Expenses"
          value={
            summary.totalExpenses
          }
          subtitle="Recorded expenses"
        />

        <SummaryCard
          title="Net Cash Flow"
          value={
            summary.netCashFlow
          }
          subtitle="Income minus expenses"
        />

      </section>

      {/* =====================================================
          RISK
          ===================================================== */}

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

      {/* =====================================================
          CHARTS
          ===================================================== */}

      <section className="charts-grid">

        {/* PROJECTION */}

        <div className="chart-card large">

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
                future obligations
              </p>

            </div>

          </div>

          <div className="chart-container">

            {projectionChartData.length >
            0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={
                    projectionChartData
                  }
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="date"
                  />

                  <YAxis
                    tickFormatter={
                      (value) =>
                        `₹${(
                          Number(value) /
                          1000
                        ).toLocaleString(
                          "en-IN"
                        )}k`
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(
                        value
                      )
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Projected Balance"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 5 }}
                  />

                </LineChart>

              </ResponsiveContainer>

            ) : (

              <EmptyChart
                text="No projection data"
              />

            )}

          </div>

        </div>

        {/* PIE */}

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
                Actual recorded transactions only
              </p>

            </div>

          </div>

          <div className="pie-container">

            {pieData.length > 0 ? (

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
                    outerRadius={105}
                    innerRadius={60}
                    paddingAngle={
                      pieData.length > 1
                        ? 5
                        : 0
                    }
                  >

                    {pieData.map(
                      (entry, index) => (

                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.name ===
                            "Income"
                              ? "#16a34a"
                              : "#dc2626"
                          }
                        />

                      )
                    )}

                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(
                        value
                      )
                    }
                  />

                  <Legend />

                </PieChart>

              </ResponsiveContainer>

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

      {/* =====================================================
          TRANSACTION HISTORY
          ===================================================== */}

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

          {transactions.length ===
          0 ? (

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
              .map(
                (transaction) => {

                  const income =
                    transaction.type ===
                    "INCOME";

                  return (

                    <div
                      className="transaction-row"
                      key={
                        transaction.id
                      }
                    >

                      <div>

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
                          className="secondary-button"
                          onClick={() =>
                            startTransactionEdit(
                              transaction
                            )
                          }
                          disabled={saving}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleTransactionDelete(
                              transaction.id
                            )
                          }
                          disabled={saving}
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  );
                }
              )

          )}

        </div>

      </section>

      {/* =====================================================
          UPCOMING EVENTS
          ===================================================== */}

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

          {obligations.length >
            0 && (

            <button
              className="danger-outline"
              onClick={
                handleDeleteAllObligations
              }
              disabled={saving}
            >
              Clear All
            </button>

          )}

        </div>

        {/* ADD / EDIT FUTURE CASH FLOW */}

        <div
          id="future-cash-flow-form"
          className="management-card timeline-form-card"
        >

          <h3>
            {editingObligationId
              ? "Edit Future Cash Flow"
              : "Add future cash flow"}
          </h3>

          <p>
            Only dates after today are allowed here.
          </p>

          <form
            className="entry-form"
            onSubmit={
              handleObligationSubmit
            }
          >

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
              placeholder="Amount"
            />

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
              placeholder="Description"
            />

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

            <button
              type="submit"
              disabled={saving}
            >
              {editingObligationId
                ? "Update"
                : "Add"}
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

          </form>

        </div>

        {/* TIMELINE */}

        <div className="timeline-card">

          {projection.length ===
          0 ? (

            <div className="empty-list">
              No upcoming cash flows.
            </div>

          ) : (

            projection.map(
              (item, index) => {

                const positive =
                  Number(
                    item.change
                  ) >= 0;

                const obligation =
                  obligations.find(
                    (o) =>
                      o.description ===
                        item.description &&
                      String(
                        o.dueDate
                      ) ===
                        String(
                          item.date
                        )
                  );

                return (

                  <div
                    className="timeline-item"
                    key={`${item.date}-${index}`}
                  >

                    <div className="timeline-date">
                      {formatDate(
                        item.date
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

                      <div>

                        <h3>
                          {
                            item.description
                          }
                        </h3>

                        <p>
                          {positive
                            ? "Upcoming income"
                            : "Upcoming expense"}
                        </p>

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
                            : ""}

                          {formatCurrency(
                            item.change
                          )}
                        </strong>

                        <span>
                          Projected balance:{" "}
                          {formatCurrency(
                            item.cashBalance
                          )}
                        </span>

                        {obligation && (

                          <div className="row-actions">

                            <button
                              className="secondary-button"
                              onClick={() =>
                                startObligationEdit(
                                  obligation
                                )
                              }
                              disabled={saving}
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
                            >
                              Mark as Done
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                handleObligationDelete(
                                  obligation.id
                                )
                              }
                              disabled={saving}
                            >
                              Delete
                            </button>

                          </div>

                        )}

                      </div>

                    </div>

                  </div>

                );
              }
            )

          )}

        </div>

      </section>

      {/* =====================================================
          RECOMMENDATIONS
          ===================================================== */}

      {recommendations.length >
        0 && (

        <section className="section">

          <div className="section-heading">

            <div>

              <div className="section-eyebrow">
                ACTION PLAN
              </div>

              <h2>
                Recommended Actions
              </h2>

              <p>
                Based on your projected cash position
              </p>

            </div>

          </div>

          <div className="recommendations-grid">

            {recommendations.map(
              (item, index) => (

                <div
                  className="recommendation-card"
                  key={index}
                >

                  <div className="recommendation-top">

                    <span
                      className={`priority ${String(
                        item.priority || ""
                      ).toLowerCase()}`}
                    >
                      {item.priority}
                    </span>

                    <span>
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                  </div>

                  <h3>
                    {item.title}
                  </h3>

                  <div>

                    <span className="label">
                      Why
                    </span>

                    <p>
                      {item.reason}
                    </p>

                  </div>

                  <div>

                    <span className="label">
                      Action
                    </span>

                    <p>
                      {item.action}
                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        </section>

      )}

      {/* =====================================================
          AI
          ===================================================== */}

      {aiData && (

        <section className="ai-section">

          <div className="ai-header">

            <div className="ai-logo">
              ✦
            </div>

            <div>

              <div className="section-eyebrow">
                POWERED BY CASHPILOT AI
              </div>

              <h2>
                AI Cash Flow Analysis
              </h2>

              <p>
                Intelligent analysis of your
                financial position
              </p>

            </div>

          </div>

          <div className="ai-grid">

            <AIBox
              label="SUMMARY"
              title="What's happening?"
              text={
                aiData.summary
              }
            />

            <AIBox
              label="RISK EXPLANATION"
              title="Why is this happening?"
              text={
                aiData.riskExplanation
              }
            />

            <AIBox
              label="PRIORITY ACTION"
              title="What should you do first?"
              text={
                aiData.priorityAction
              }
            />

            <AIBox
              label="OUTLOOK"
              title="What happens next?"
              text={
                aiData.outlook
              }
            />

          </div>

        </section>

      )}

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

/* =========================================================
   COMPONENTS
   ========================================================= */

function SummaryCard({
  title,
  value,
  subtitle,
  primary = false,
}) {

  return (

    <div
      className={`summary-card ${
        primary ? "primary" : ""
      }`}
    >

      <span className="summary-label">
        {title}
      </span>

      <strong className="summary-value">
        {`₹${Number(
          value || 0
        ).toLocaleString(
          "en-IN",
          {
            maximumFractionDigits: 2,
          }
        )}`}
      </strong>

      <span className="summary-subtitle">
        {subtitle}
      </span>

    </div>
  );
}

function EmptyChart({
  text,
}) {

  return (
    <div className="empty-chart">
      {text}
    </div>
  );
}

function AIBox({
  label,
  title,
  text,
}) {

  return (

    <div className="ai-card">

      <div className="ai-card-icon">
        ✦
      </div>

      <div>

        <span>
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

/* =========================================================
   DATE HELPERS
   ========================================================= */

function getLocalDateTime() {

  const now =
    new Date();

  const offset =
    now.getTimezoneOffset();

  const local =
    new Date(
      now.getTime() -
        offset * 60 * 1000
    );

  return local
    .toISOString()
    .slice(0, 16);
}

function getTodayDate() {

  const now =
    new Date();

  const offset =
    now.getTimezoneOffset();

  const local =
    new Date(
      now.getTime() -
        offset * 60 * 1000
    );

  return local
    .toISOString()
    .slice(0, 10);
}

function getTomorrowDate() {

  const now =
    new Date();

  now.setDate(
    now.getDate() + 1
  );

  const offset =
    now.getTimezoneOffset();

  const local =
    new Date(
      now.getTime() -
        offset * 60 * 1000
    );

  return local
    .toISOString()
    .slice(0, 10);
}

function toLocalDateTimeInput(
  value
) {

  if (!value) {
    return getLocalDateTime();
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return getLocalDateTime();
  }

  const offset =
    date.getTimezoneOffset();

  const local =
    new Date(
      date.getTime() -
        offset * 60 * 1000
    );

  return local
    .toISOString()
    .slice(0, 16);
}

export default Dashboard;