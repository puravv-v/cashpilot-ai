import os
import json

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def analyze_finances(data):

    financial_data = data.model_dump()

    prompt = f"""
You are CashPilot AI, an intelligent business
cash-flow analysis assistant.

Analyze the following REAL business cash-flow data.

FINANCIAL DATA:
{json.dumps(
    financial_data,
    indent=2,
    default=str
)}

Return ONLY valid JSON.

Return exactly these six fields:

{{
  "summary": "...",
  "riskExplanation": "...",
  "businessPattern": "...",
  "priorityAction": "...",
  "outlook": "...",
  "scenarioAnalysis": "..."
}}

Your six sections must mean:

1. summary

This is the executive summary.

Explain the overall financial position,
current cash, major movements, and the most
important thing happening right now.

This should be the most useful high-level
interpretation of the business.

2. riskExplanation

Explain the biggest cash-flow exposure.

Mention the exact relevant amount and date
when available.

Explain why the business is exposed.

3. businessPattern

Look at the recorded income, expenses,
future cash flows, and projected balances.

Identify a meaningful business pattern.

Examples:
- expenses are concentrated around a particular event
- income is dependent on a large incoming payment
- expenses are consistently larger than income
- cash is healthy now but future obligations create pressure
- incoming payments appear concentrated

Do not invent patterns that are not supported
by the supplied data.

4. priorityAction

State the single most important action
the business should take first.

Be practical and specific.

5. outlook

Explain what is likely to happen next based
only on the supplied projection.

Mention important future dates and balances
when relevant.

6. scenarioAnalysis

Analyze this exact scenario:

"What if a major customer payment is delayed?"

Use only amounts and dates actually present
in the supplied data.

If there is an upcoming income payment,
explain how delaying it would affect the
projected cash position.

Do not invent a payment amount.

If there is no meaningful upcoming income,
say that the available data does not contain
a major upcoming customer payment and explain
the implication using the available numbers.

RULES:

- Use exact financial numbers.
- Never invent transactions.
- Never invent amounts.
- Never invent dates.
- Use Indian Rupee notation such as ₹.
- Keep the analysis practical.
- Do not use markdown.
- Do not use bullet points inside the values.
- Each field should be readable as normal prose.
- Return JSON only.
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are CashPilot AI. "
                    "Return only valid JSON."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
        max_completion_tokens=1400
    )

    text = (
        response
        .choices[0]
        .message
        .content
    )

    text = text.strip()

    if text.startswith("```json"):
        text = text[7:]

    if text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    text = text.strip()

    return json.loads(text)