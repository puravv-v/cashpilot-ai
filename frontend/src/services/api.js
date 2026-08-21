import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   CASH FLOW SUMMARY
   ========================================================= */

export const getCashFlowSummary = async () => {
  const response = await API.get("/cashflow/summary");
  return response.data;
};

/* =========================================================
   CASH FLOW PROJECTION
   ========================================================= */

export const getCashFlowProjection = async (currentCash) => {
  const response = await API.get("/obligations/projection", {
    params: {
      currentCash: Number(currentCash || 0),
    },
  });

  return Array.isArray(response.data)
    ? response.data
    : response.data?.value || [];
};

/* =========================================================
   CASH FLOW RISK
   ========================================================= */

export const getCashFlowRisk = async (currentCash) => {
  const response = await API.get("/obligations/risk", {
    params: {
      currentCash: Number(currentCash || 0),
    },
  });

  return response.data;
};

/* =========================================================
   RECOMMENDATIONS
   ========================================================= */

export const getRecommendations = async (currentCash) => {
  const response = await API.get("/obligations/recommendations", {
    params: {
      currentCash: Number(currentCash || 0),
    },
  });

  return Array.isArray(response.data)
    ? response.data
    : response.data?.value || [];
};

/* =========================================================
   AI
   ========================================================= */

export const getAIAnalysis = async (data) => {
  const response = await API.post("/ai/analyze", data);
  return response.data;
};

/* =========================================================
   TRANSACTIONS
   ========================================================= */

export const getTransactions = async () => {
  const response = await API.get("/transactions");

  return Array.isArray(response.data)
    ? response.data
    : response.data?.value || [];
};

export const getAllTransactions = async () => {
  return getTransactions();
};

export const createTransaction = async (transaction) => {
  const response = await API.post(
    "/transactions",
    transaction
  );

  return response.data;
};

export const addTransaction = async (transaction) => {
  return createTransaction(transaction);
};

export const deleteTransaction = async (id) => {
  await API.delete(`/transactions/${id}`);
};

export const deleteAllTransactions = async () => {
  const transactions = await getTransactions();

  await Promise.all(
    transactions
      .filter((transaction) => transaction?.id != null)
      .map((transaction) =>
        deleteTransaction(transaction.id)
      )
  );
};

/* =========================================================
   UPCOMING CASH FLOWS / OBLIGATIONS
   ========================================================= */

export const getObligations = async () => {
  const response = await API.get("/obligations");

  return Array.isArray(response.data)
    ? response.data
    : response.data?.value || [];
};

export const getAllObligations = async () => {
  return getObligations();
};

export const createObligation = async (obligation) => {
  const response = await API.post(
    "/obligations",
    obligation
  );

  return response.data;
};

export const addObligation = async (obligation) => {
  return createObligation(obligation);
};

export const deleteObligation = async (id) => {
  await API.delete(`/obligations/${id}`);
};

/*
 * The backend does not currently have:
 *
 * DELETE /api/obligations
 *
 * So Clear All is implemented by fetching all
 * obligations and deleting them one by one.
 */
export const deleteAllObligations = async () => {
  const obligations = await getObligations();

  await Promise.all(
    obligations
      .filter((obligation) => obligation?.id != null)
      .map((obligation) =>
        deleteObligation(obligation.id)
      )
  );
};

/* =========================================================
   STARTING CASH
   ========================================================= */

/*
 * Backend endpoint:
 *
 * GET /api/settings/starting-cash
 */
export const getStartingCash = async () => {
  const response = await API.get(
    "/settings/starting-cash"
  );

  return response.data;
};

/*
 * Backend expects:
 *
 * @RequestBody BigDecimal amount
 *
 * Therefore we send the number directly.
 *
 * NOT:
 * { amount: number }
 */
export const updateStartingCash = async (amount) => {
  const numericAmount = Number(amount);

  const response = await API.put(
    "/settings/starting-cash",
    numericAmount,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

/* =========================================================
   DEFAULT EXPORT
   ========================================================= */

export default API;