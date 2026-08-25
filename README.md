# CashPilot

AI-powered cash-flow management and financial decision-support platform for businesses.

CashPilot helps businesses understand their current cash position, forecast future cash flow, identify liquidity risks, receive practical recommendations, and explore hypothetical good and bad cash-flow scenarios.

---

## Features

### Cash Flow Management

- Track income and expenses
- View current cash position
- View cash-flow summaries
- Add upcoming income and expenses
- Manage future cash obligations
- Mark future obligations as completed

### Cash Flow Projection

CashPilot projects future cash balances using upcoming cash inflows and outflows.

Each projection contains:

- Date
- Cash-flow change
- Running cash balance
- Description

### Risk Detection

The system identifies the lowest projected cash balance and classifies the risk as:

```text
LOW
WARNING
CRITICAL
```

### Financial Recommendations

CashPilot provides recommendations based on upcoming financial obligations and projected cash flow, including:

- Large upcoming expenses
- Incoming payments before expenses
- Cash-buffer requirements
- Infrastructure spending
- Cash-flow risks

### AI Financial Analysis

CashPilot provides:

- Financial summary
- Risk explanation
- Business pattern
- Priority action
- Near-term outlook
- Good scenario
- Bad scenario

The AI is grounded only in the supplied financial data and is instructed not to invent transactions, amounts, dates, payments, customers, income, expenses, or events.

---

## AI Cash-Flow Scenarios

The Good Scenario and Bad Scenario are **hypothetical timing what-if analyses**.

### Good Scenario

The AI considers favorable timing changes involving existing future cash flows, such as:

- Payment arriving early
- Payment arriving before an important expense
- Expense being delayed

It explains how the timing change could improve the cash position or prevent/reduce a projected negative balance.

### Bad Scenario

The AI considers unfavorable timing changes, such as:

- Payment being delayed
- Payment arriving after an important expense
- Expense arriving earlier
- Expense occurring before expected income

It explains how the timing change could increase cash pressure or cause the balance to become negative.

The scenarios are hypothetical and are not presented as events that will actually happen.

---

## Architecture

```text
                         CashPilot

        ┌───────────────────────────────┐
        │        React Frontend         │
        └───────────────┬───────────────┘
                        │ REST API
                        ▼
        ┌───────────────────────────────┐
        │      Spring Boot Backend      │
        │                               │
        │ Auth • Transactions           │
        │ Cash Flow • Risk              │
        │ Obligations • Recommendations│
        └───────────┬───────────┬───────┘
                    │           │
                    │           ▼
                    │      PostgreSQL
                    │
                    ▼
        ┌───────────────────────────────┐
        │     Python FastAPI AI Service │
        └───────────────┬───────────────┘
                        │
                        ▼
                   ┌─────────┐
                   │ Groq API│
                   └─────────┘
```

### Responsibilities

**React Frontend**

Handles the user interface, interaction, API requests, and presentation of financial and AI information.

**Spring Boot Backend**

Handles authentication, user data, database operations, financial calculations, projections, risk detection, recommendations, and AI-service integration.

**PostgreSQL**

Stores application and financial data.

**Python AI Service**

Processes structured financial data, communicates with the Groq API, extracts the AI response, and validates the returned analysis.

**Groq API**

Provides the language-model generation used for financial analysis.

---

## Cash-Flow Logic

For income:

```text
New Balance = Previous Balance + Income
```

For expense:

```text
New Balance = Previous Balance - Expense
```

The backend processes future obligations chronologically to produce the projected running balance.

Risk is determined from the lowest projected balance.

```text
Balance <= ₹10,000
        → CRITICAL

₹10,000 < Balance <= ₹25,000
        → WARNING

Balance > ₹25,000
        → LOW
```

---

## API

Backend API base path:

```text
/api
```

### Authentication

```text
POST /api/auth/login
POST /api/auth/register
```

### Cash Flow

```text
GET /api/cashflow/summary
GET /api/cashflow/projection
GET /api/cashflow/risk
GET /api/cashflow/recommendations
```

### Cash Obligations

```text
POST   /api/obligations
GET    /api/obligations
GET    /api/obligations/upcoming
PUT    /api/obligations/{id}
POST   /api/obligations/{id}/complete
DELETE /api/obligations/{id}
GET    /api/obligations/projection
GET    /api/obligations/risk
GET    /api/obligations/recommendations
```

### AI Analysis

```text
POST /api/ai/analyze
```

The AI response contains:

```text
summary
riskExplanation
businessPattern
priorityAction
outlook
goodScenario
badScenario
```

---

## Project Structure

```text
cashpilot-ai/
│
├── frontend/          # React frontend
│
├── backend/           # Spring Boot backend
│
├── ai-service/        # Python FastAPI AI service
│
├── docs/              # Additional documentation
│
└── README.md
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Frontend Build Tool | Vite |
| Backend | Spring Boot |
| Backend Language | Java |
| Database | PostgreSQL |
| AI Service | Python |
| AI Framework | FastAPI |
| AI Provider | Groq |
| AI Model | `openai/gpt-oss-120b` |

---

## Running Locally

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
mvn spring-boot:run
```

### AI Service

```bash
cd ai-service
python -m uvicorn app.main:app --reload
```

Required AI environment variable:

```text
GROQ_API_KEY
```

The backend also requires the configured AI service URL.

---

## Deployment

CashPilot is deployed as separate services.

```text
React Frontend
      │
      ▼
Spring Boot Backend
      │
      ├── PostgreSQL
      │
      ▼
Python AI Service
      │
      ▼
Groq API
```

Production configuration is supplied through environment variables rather than hard-coded credentials.

---

## Security and Data Handling

Financial operations are performed in the context of the authenticated user.

The backend uses user-specific data when accessing:

- Transactions
- Cash obligations
- Cash-flow projections
- Risk information
- Recommendations

Secrets such as API keys and database credentials are stored through environment configuration and should not be committed to Git.

---

## Development Workflow

```text
Develop
   ↓
Test locally
   ↓
Review git status
   ↓
Commit
   ↓
Push to main
   ↓
Deploy
   ↓
Verify production
```

---

## Repository Documentation

This README contains the main project documentation.

Additional technical documentation can be added under:

```text
docs/
```

---

## Project Goal

CashPilot is designed to move beyond simply displaying financial data.

It combines deterministic financial calculations with AI-powered interpretation to help a business answer:

```text
How much cash do I have?
        ↓
What will happen to my cash?
        ↓
Where is the risk?
        ↓
What should I do?
        ↓
What if cash arrives earlier?
        ↓
What if cash arrives later?
```

The goal is to turn cash-flow data into practical financial decision support.