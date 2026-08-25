import os
import json
import re

from dotenv import load_dotenv
from groq import Groq


load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def _extract_json(text: str):
    """
    Extract a JSON object even if the model wraps it
    in markdown fences or surrounding text.
    """

    if not text:
        raise ValueError("Groq returned an empty response.")

    text = text.strip()

    # Remove markdown fences
    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    text = text.strip()

    # Direct JSON
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Find first JSON object
    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1 or end <= start:
        raise ValueError(
            f"Groq did not return a JSON object: {text}"
        )

    json_text = text[start:end + 1]

    try:
        return json.loads(json_text)

    except json.JSONDecodeError as error:
        raise ValueError(
            f"Groq returned invalid JSON: {error}\n"
            f"Response: {text}"
        )


def analyze_finances(data):

    projection = []

    for item in (data.projection or []):

        projection.append({
            "date": str(item.date),
            "balance": float(item.cashBalance),
            "change": float(item.change),
            "description": item.description
        })

    financial_data = {
        "currentCash": float(data.currentCash),
        "startingCash": float(data.startingCash),
        "totalIncome": float(data.totalIncome),
        "totalExpenses": float(data.totalExpenses),

        "projection": projection,

        "risk": (
            data.risk.model_dump(
                exclude_none=True
            )
            if data.risk
            else {}
        ),

        "recommendations": [
            recommendation.model_dump(
                exclude_none=True
            )
            for recommendation in (
                data.recommendations or []
            )
        ]
    }

    financial_json = json.dumps(
        financial_data,
        separators=(",", ":"),
        ensure_ascii=False
    )

    prompt = f"""
You are CashPilot AI.

Analyze this real business cash-flow data:

{financial_json}

Return ONE JSON object with exactly these fields:

summary
riskExplanation
businessPattern
priorityAction
outlook
goodScenario
badScenario

Every value must be a string.

Use ONLY the supplied financial data. Do not invent any
transactions, amounts, dates, customers, payments, income,
expenses, or events.

SUMMARY:
Summarize the current cash position using the supplied data.

RISK:
Explain the main cash-flow risk using actual amounts and dates
from the supplied projection and risk data.

BUSINESS PATTERN:
Identify a real pattern visible in the supplied data.

PRIORITY ACTION:
Give the most important practical action based on the supplied data.

OUTLOOK:
Explain the near-term financial outlook based on the supplied data.

GOOD SCENARIO:
This must be a CONDITIONAL WHAT-IF scenario, not a description
of something that is already scheduled to happen.

Look at the existing future cash flows and identify a realistic
favorable timing change involving those same existing cash flows.
Prefer cases such as:
- an expected incoming payment arriving early;
- an expected incoming payment arriving on time before an important expense;
- an upcoming expense being paid later than currently scheduled;
- an incoming payment arriving before an expense that currently creates pressure.

Explain what would happen to the cash position if that favorable
timing occurred. If the supplied projection shows a negative
balance, say whether the favorable timing could prevent or reduce
the negative balance. If the supplied projection stays positive,
say how the favorable timing would improve the cash buffer.
Use the actual amount/date/event from the supplied data where relevant.

BAD SCENARIO:
This must also be a CONDITIONAL WHAT-IF scenario, not a description
of something that is already scheduled to happen.

Look at the existing future cash flows and identify a realistic
unfavorable timing change involving those same existing cash flows.
Prefer cases such as:
- an expected incoming payment being delayed;
- an expected incoming payment arriving after an important expense;
- an upcoming expense arriving earlier than currently scheduled;
- an expense occurring before an expected payment;
- multiple existing expenses creating a tighter timing window before an expected payment.

Explain what would happen to the cash position if that unfavorable
timing occurred. If the balance could become negative, explicitly
say that it could become negative and use the actual projected
balance/date when the supplied data supports it. Otherwise explain
which existing timing window would create the greatest cash pressure.

IMPORTANT SCENARIO RULES:
1. Do NOT merely repeat an event that is already scheduled.
2. The words "if", "could", "would", "may", or equivalent conditional
   wording must make clear that the scenario is hypothetical.
3. Do NOT claim that a payment will actually be delayed or an expense
   will actually arrive early.
4. Do NOT invent a new transaction or amount.
5. Use existing future cash flows as the basis for the what-if.
6. Prefer timing relationships between an existing income and an
   existing expense rather than isolated event descriptions.
7. State the cash-flow consequence, especially whether the balance
   remains positive or could become negative.
8. If there is no meaningful income/expense timing relationship in the
   supplied data, clearly say that a meaningful timing scenario cannot
   be determined from the available future cash flows instead of inventing one.

Keep every field concise. Each field should be one short sentence.
Use ₹ for currency.

Return JSON only.
"""

    response = client.chat.completions.create(

        model="openai/gpt-oss-120b",

        messages=[
            {
                "role": "system",
                "content": (
                    "You are CashPilot AI. "
                    "Analyze only supplied financial data. "
                    "Good and bad scenarios are hypothetical timing "
                    "what-if statements based on existing future cash flows. "
                    "Never present the hypothetical timing change as an actual event. "
                    "Return one JSON object with exactly seven string fields."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],

        temperature=0,

        max_completion_tokens=1400
    )

    text = response.choices[0].message.content

    print("\n===== GROQ RAW RESPONSE =====")
    print(text)
    print("=============================\n")

    result = _extract_json(text)

    required_fields = [
        "summary",
        "riskExplanation",
        "businessPattern",
        "priorityAction",
        "outlook",
        "goodScenario",
        "badScenario"
    ]

    for field in required_fields:

        if field not in result:

            raise ValueError(
                f"AI response missing required field: {field}"
            )

        if not isinstance(result[field], str):

            result[field] = str(
                result[field]
            )

    return result