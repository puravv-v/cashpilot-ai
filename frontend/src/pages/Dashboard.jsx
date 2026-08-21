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
  deleteTransaction,

  getObligations,
  createObligation,
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

  const [transactions, setTransactions] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [projection, setProjection] = useState([]);
  const [risk, setRisk] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [aiData, setAiData] = useState(null);

  const [saving, setSaving] = useState(false);

  const [startingCashInput, setStartingCashInput] =
    useState("");

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
      dueDate: getTodayDate(),
    });


  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    loadDashboard();
  }, []);


  /* =========================================================
     LOAD DASHBOARD
     ========================================================= */

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      /*
       * FIRST get the actual backend summary.
       *
       * currentCash comes from:
       *
       * startingCash
       * + income
       * - expenses
       *
       * Nothing is hardcoded here.
       */

      const summaryData =
        await getCashFlowSummary();

      const startingCash = Number(
        summaryData?.startingCash ?? 0
      );

      const totalIncome = Number(
        summaryData?.totalIncome ?? 0
      );

      const totalExpenses = Number(
        summaryData?.totalExpenses ?? 0
      );

      const netCashFlow =
        totalIncome - totalExpenses;

      const currentCash = Number(
        summaryData?.currentCash ??
        (startingCash + netCashFlow)
      );


      /*
       * Now that we know the real current cash,
       * use THAT for projection/risk/recommendations.
       */

      const [
        transactionData,
        obligationData,
        projectionData,
        riskData,
        recommendationData,
      ] = await Promise.all([
        getTransactions(),
        getObligations(),
        getCashFlowProjection(currentCash),
        getCashFlowRisk(currentCash),
        getRecommendations(currentCash),
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
        startingCash,
        currentCash,
        totalIncome,
        totalExpenses,
        netCashFlow,
      });

      setStartingCashInput(
        summaryData?.startingCash ?? ""
      );

      setTransactions(cleanTransactions);
      setObligations(cleanObligations);
      setProjection(cleanProjection);
      setRisk(riskData);
      setRecommendations(cleanRecommendations);


      /* =====================================================
         AI ANALYSIS
         ===================================================== */

      try {
        const aiResponse =
          await getAIAnalysis({
            currentCash,
            startingCash,
            totalIncome,
            totalExpenses,
            netCashFlow,
            projection: cleanProjection,
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


  /* =========================================================
     STARTING CASH
     ========================================================= */

  async function handleStartingCashSubmit(event) {
    event.preventDefault();

    const amount = Number(
      startingCashInput
    );

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

      await updateStartingCash(amount);

      await loadDashboard();

    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
        "Unable to update starting cash."
      );
    } finally {
      setSaving(false);
    }
  }


  /* =========================================================
     TRANSACTION
     ========================================================= */

  async function handleTransactionSubmit(event) {
    event.preventDefault();

    const amount = Number(
      transactionForm.amount
    );

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

    try {
      setSaving(true);

      await createTransaction({
        amount,
        type: transactionForm.type,
        description:
          transactionForm.description.trim(),
        transactionDate:
          transactionForm.transactionDate,
      });

      setTransactionForm({
        amount: "",
        type: "INCOME",
        description: "",
        transactionDate:
          getLocalDateTime(),
      });

      await loadDashboard();

    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
        "Unable to add transaction."
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
      await deleteTransaction(id);

      await loadDashboard();

    } catch (err) {
      console.error(err);

      alert(
        "Unable to delete transaction."
      );
    }
  }


  /* =========================================================
     FUTURE CASH FLOW
     ========================================================= */

  async function handleObligationSubmit(event) {
    event.preventDefault();

    const amount = Number(
      obligationForm.amount
    );

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

    if (!obligationForm.dueDate) {
      alert(
        "Select a date."
      );
      return;
    }

    try {
      setSaving(true);

      await createObligation({
        amount,
        type: obligationForm.type,
        description:
          obligationForm.description.trim(),
        dueDate:
          obligationForm.dueDate,
      });

      setObligationForm({
        amount: "",
        type: "EXPENSE",
        description: "",
        dueDate: getTodayDate(),
      });

      await loadDashboard();

    } catch (err) {
      console.error(err);

      alert(
        err?.response?.data?.message ||
        "Unable to add future cash flow."
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
      await deleteObligation(id);

      await loadDashboard();

    } catch (err) {
      console.error(err);

      alert(
        "Unable to delete upcoming item."
      );
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


  /* =========================================================
     CHART DATA
     ========================================================= */

  const projectionChartData = useMemo(() => {
    const currentPoint = {
      date: "Now",
      balance: Number(
        summary.currentCash || 0
      ),
    };

    const futurePoints = projection
      .map((item) => ({
        date: formatDate(item.date),
        balance: Number(
          item.cashBalance || 0
        ),
      }));

    return [
      currentPoint,
      ...futurePoints,
    ];
  }, [
    projection,
    summary.currentCash,
  ]);


  /*
   * IMPORTANT:
   * This uses ONLY actual recorded transactions.
   *
   * Starting cash is NOT included.
   */

  const pieData = useMemo(() => {
    const income = Math.max(
      Number(summary.totalIncome || 0),
      0
    );

    const expenses = Math.max(
      Number(summary.totalExpenses || 0),
      0
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


  /* =========================================================
     HELPERS
     ========================================================= */

  function formatCurrency(value) {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }


  function formatSignedCurrency(value) {
    const number = Number(value || 0);

    return `${number >= 0 ? "+" : "-"}₹${Math.abs(
      number
    ).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }


  function formatDate(value) {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
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
      String(severity || "")
        .toUpperCase()
    ) {
      case "CRITICAL":
        return "risk-critical";

      case "HIGH":
        return "risk-high";

      case "WARNING":
        return "risk-warning";

      case "MEDIUM":
        return "risk-medium";

      default:
        return "risk-low";
    }
  }


  /* =========================================================
     LOADING
     ========================================================= */

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


  /* =========================================================
     DASHBOARD
     ========================================================= */

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
          ACCOUNT SETUP + TRANSACTION ENTRY
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
              value={startingCashInput}
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


        {/* ADD TRANSACTION */}

        <div className="management-card">

          <div className="section-eyebrow">
            ADD CASH FLOW
          </div>

          <h2>
            Record Income or Expense
          </h2>

          <form
            className="entry-form"
            onSubmit={
              handleTransactionSubmit
            }
          >

            <select
              value={transactionForm.type}
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
              Add
            </button>

          </form>

        </div>

      </section>


      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <section className="summary-grid">

        <SummaryCard
          title="Current Cash"
          value={summary.currentCash}
          subtitle="Starting cash + actual net flow"
          primary
        />

        <SummaryCard
          title="Starting Cash"
          value={summary.startingCash}
          subtitle="Opening balance"
        />

        <SummaryCard
          title="Total Income"
          value={summary.totalIncome}
          subtitle="Recorded income"
          income
        />

        <SummaryCard
          title="Total Expenses"
          value={summary.totalExpenses}
          subtitle="Recorded expenses"
          expense
        />

        <SummaryCard
          title="Net Cash Flow"
          value={summary.netCashFlow}
          subtitle="Income minus expenses"
          net
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

            <div className="risk-main">

              <div className="risk-icon">
                !
              </div>

              <div>

                <span className="risk-badge">
                  {risk.severity || "LOW"}
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

            </div>


            <div className="risk-stats">

              <div>
                <span>
                  Risk Date
                </span>

                <strong>
                  {formatDate(
                    risk.riskDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Projected Balance
                </span>

                <strong>
                  {formatCurrency(
                    risk.projectedBalance
                  )}
                </strong>
              </div>

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

            {projectionChartData.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={projectionChartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 10,
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
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
                        Number(value) /
                        1000
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

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Projected Balance"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      fill: "#ffffff",
                      stroke: "#4f46e5",
                      strokeWidth: 3,
                    }}
                    activeDot={{
                      r: 7,
                    }}
                  />

                </LineChart>

              </ResponsiveContainer>

            ) : (

              <EmptyChart
                text="No upcoming cash flows"
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
                    outerRadius={95}
                    innerRadius={55}
                    paddingAngle={
                      pieData.length > 1
                        ? 4
                        : 0
                    }
                    labelLine={false}
                  >

                    {pieData.map(
                      (entry, index) => (
                        <Cell
                          key={
                            `cell-${index}`
                          }
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
                      formatCurrency(value)
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
              Income and expenses entered by the user
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

                    <div>

                      <strong>
                        {transaction.description}
                      </strong>

                      <span>
                        {income
                          ? "Income"
                          : "Expense"}

                        {" • "}

                        {formatDateTime(
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
                      {income ? "+" : "-"}
                      {formatCurrency(
                        transaction.amount
                      )}
                    </strong>


                    <button
                      className="delete-button"
                      onClick={() =>
                        handleTransactionDelete(
                          transaction.id
                        )
                      }
                    >
                      Delete
                    </button>

                  </div>
                );
              })

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
              Future income and expenses
              affecting projected balance
            </p>

          </div>


          {obligations.length > 0 && (
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


        {/* ADD FUTURE CASH FLOW */}

        <div className="management-card timeline-form-card">

          <h3>
            Add future cash flow
          </h3>

          <form
            className="entry-form"
            onSubmit={
              handleObligationSubmit
            }
          >

            <select
              value={obligationForm.type}
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
              Add
            </button>

          </form>

        </div>


        {/* TIMELINE */}

        <div className="timeline-card">

          {projection.length === 0 ? (

            <div className="empty-list">
              No upcoming cash flows.
            </div>

          ) : (

            projection.map(
              (item, index) => {

                const positive =
                  Number(item.change) >= 0;

                const obligation =
                  obligations.find(
                    (o) =>
                      o.description ===
                        item.description &&
                      String(o.dueDate) ===
                        String(item.date)
                  );

                return (
                  <div
                    className="timeline-item"
                    key={`${item.date}-${index}`}
                  >

                    <div className="timeline-date">
                      {formatDate(item.date)}
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
                          {item.description}
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
                          <button
                            className="delete-button"
                            onClick={() =>
                              handleObligationDelete(
                                obligation.id
                              )
                            }
                          >
                            Delete
                          </button>
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

      {recommendations.length > 0 && (

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
                Practical steps based on
                your projected cash position
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

                    <span className="recommendation-number">
                      {String(
                        index + 1
                      ).padStart(2, "0")}
                    </span>

                  </div>


                  <h3>
                    {item.title}
                  </h3>


                  <div className="recommendation-reason">

                    <span>
                      Why
                    </span>

                    <p>
                      {item.reason}
                    </p>

                  </div>


                  <div className="recommendation-action">

                    <span>
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
              text={aiData.summary}
            />

            <AIBox
              label="RISK EXPLANATION"
              title="Why is this happening?"
              text={aiData.riskExplanation}
            />

            <AIBox
              label="PRIORITY ACTION"
              title="What should you do first?"
              text={aiData.priorityAction}
            />

            <AIBox
              label="OUTLOOK"
              title="What happens next?"
              text={aiData.outlook}
            />

          </div>

        </section>

      )}


      {/* FOOTER */}

      <footer className="dashboard-footer">

        <div>
          <strong>
            CashPilot
          </strong>

          <span>
            AI-powered financial intelligence
          </span>
        </div>

        <span>
          Cash flow insights generated
          from your current data
        </span>

      </footer>

    </div>
  );
}


/* =========================================================
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
  title,
  value,
  subtitle,
  primary = false,
  income = false,
  expense = false,
  net = false,
}) {
  return (
    <div
      className={`summary-card ${
        primary ? "primary" : ""
      } ${
        income ? "income-card" : ""
      } ${
        expense ? "expense-card" : ""
      } ${
        net ? "net-card" : ""
      }`}
    >

      <span className="summary-label">
        {title}
      </span>

      <strong className="summary-value">
        {net
          ? formatSignedCurrencyStatic(
              value
            )
          : formatCurrencyStatic(
              value
            )}
      </strong>

      <span className="summary-subtitle">
        {subtitle}
      </span>

    </div>
  );
}


/* =========================================================
   EMPTY CHART
   ========================================================= */

function EmptyChart({ text }) {
  return (
    <div className="empty-chart">
      {text}
    </div>
  );
}


/* =========================================================
   AI BOX
   ========================================================= */

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
   STATIC FORMATTERS
   ========================================================= */

function formatCurrencyStatic(value) {
  return `₹${Number(
    value || 0
  ).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}


function formatSignedCurrencyStatic(value) {
  const number = Number(
    value || 0
  );

  return `${number >= 0 ? "+" : "-"}₹${Math.abs(
    number
  ).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}


/* =========================================================
   DATE HELPERS
   ========================================================= */

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

  const year =
    now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


export default Dashboard;