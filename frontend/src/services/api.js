import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
=========================================================
JWT AUTHORIZATION
=========================================================
*/

API.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("cashpilot_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("jwt") ||
      localStorage.getItem("jwtToken") ||
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("cashpilot_token") ||
      sessionStorage.getItem("token") ||
      sessionStorage.getItem("jwt") ||
      sessionStorage.getItem("jwtToken") ||
      sessionStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/*
=========================================================
RESPONSE AUTH HANDLING
=========================================================
*/

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error?.response?.status === 401 ||
      error?.response?.status === 403
    ) {
      console.error(
        "Authentication failed:",
        error?.response?.data || error?.message
      );

      localStorage.setItem(
        "cashpilot_session_expired",
        "true"
      );
    }

    return Promise.reject(error);
  }
);

/*
=========================================================
CASH FLOW SUMMARY
=========================================================
*/

export const getCashFlowSummary = async () => {
  const response = await API.get("/cashflow/summary");

  return response.data;
};

/*
=========================================================
CASH FLOW PROJECTION
=========================================================
*/

export const getCashFlowProjection = async () => {
  const response = await API.get(
    "/cashflow/projection"
  );

  return Array.isArray(response.data)
    ? response.data
    : response.data?.value || [];
};

/*
=========================================================
CASH FLOW RISK
=========================================================
*/

export const getCashFlowRisk = async () => {
  const response = await API.get(
    "/cashflow/risk"
  );

  return response.data;
};

/*
=========================================================
CASH FLOW RECOMMENDATIONS
=========================================================
*/

export const getRecommendations = async () => {
  const response = await API.get(
    "/cashflow/recommendations"
  );

  return Array.isArray(response.data)
    ? response.data
    : response.data?.value || [];
};

/*
=========================================================
AI ANALYSIS
=========================================================
*/

export const getAIAnalysis = async (data) => {
  const response = await API.post(
    "/ai/analyze",
    data
  );

  return response.data;
};

/*
=========================================================
TRANSACTIONS
=========================================================
*/

export const getTransactions = async () => {
  const response = await API.get(
    "/transactions"
  );

  return Array.isArray(response.data)
    ? response.data
    : response.data?.value || [];
};

export const createTransaction = async (
  transaction
) => {
  const response = await API.post(
    "/transactions",
    transaction
  );

  return response.data;
};

export const updateTransaction = async (
  id,
  transaction
) => {
  const response = await API.put(
    `/transactions/${id}`,
    transaction
  );

  return response.data;
};

export const deleteTransaction = async (id) => {
  await API.delete(`/transactions/${id}`);
};

/*
=========================================================
FUTURE CASH FLOWS / OBLIGATIONS
=========================================================
*/

export const getObligations = async () => {
  const response = await API.get(
    "/obligations"
  );

  return Array.isArray(response.data)
    ? response.data
    : response.data?.value || [];
};

export const createObligation = async (
  obligation
) => {
  const response = await API.post(
    "/obligations",
    obligation
  );

  return response.data;
};

export const updateObligation = async (
  id,
  obligation
) => {
  const response = await API.put(
    `/obligations/${id}`,
    obligation
  );

  return response.data;
};

export const markObligationAsDone = async (
  id,
  actualDate
) => {
  const response = await API.post(
    `/obligations/${id}/complete`,
    null,
    {
      params: {
        actualDate,
      },
    }
  );

  return response.data;
};

export const deleteObligation = async (id) => {
  await API.delete(
    `/obligations/${id}`
  );
};

export const deleteAllObligations = async () => {
  const obligations =
    await getObligations();

  await Promise.all(
    obligations
      .filter(
        (item) => item?.id != null
      )
      .map(
        (item) =>
          deleteObligation(item.id)
      )
  );
};

/*
=========================================================
STARTING CASH
=========================================================
*/

export const getStartingCash = async () => {
  const response = await API.get(
    "/settings/starting-cash"
  );

  return response.data;
};

export const updateStartingCash = async (
  amount
) => {
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

export default API;