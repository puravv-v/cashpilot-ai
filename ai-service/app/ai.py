import os
import json

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def analyze_finances(data):

    prompt = f"""
You are CashPilot AI, a financial cash-flow analysis assistant.

Analyze the following business cash-flow information.

Financial data:
{json.dumps(data, indent=2, default=str)}

Return ONLY valid JSON.

The JSON must contain exactly these four fields:

{{
  "summary": "...",
  "riskExplanation": "...",
  "priorityAction": "...",
  "outlook": "..."
}}

Rules:

1. Be concise and practical.
2. Use the exact financial numbers provided.
3. Do not invent transactions or amounts.
4. Identify the most important cash-flow risk.
5. Identify the most important action the business should take.
6. Mention important dates when relevant.
7. Use Indian Rupee notation such as ₹ when discussing amounts.
8. Do not use markdown.
9. Return JSON only.
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": "You are CashPilot AI. Return only valid JSON."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.2,
        max_completion_tokens=800
    )

    text = response.choices[0].message.content

    # Remove accidental markdown code fences
    text = text.strip()

    if text.startswith("```json"):
        text = text[7:]

    if text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    text = text.strip()

    return json.loads(text)