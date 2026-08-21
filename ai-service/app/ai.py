import os

from google import genai
from google.genai import types
from dotenv import load_dotenv

from .models import AIAnalysisRequest, AIAnalysisResponse


load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


def analyze_finances(data: AIAnalysisRequest) -> AIAnalysisResponse:

    prompt = f"""
You are CashPilot, an AI finance controller for small and medium businesses.

Analyze the following financial information.

Current cash:
₹{data.currentCash}

Risk:
{data.risk.model_dump_json(indent=2)}

Recommended actions:
{[recommendation.model_dump() for recommendation in data.recommendations]}

Your job is to explain the situation clearly to a business owner.

Rules:
1. Never invent financial numbers.
2. Only use the financial facts provided.
3. Explain why the cash-flow risk exists.
4. Identify the single most important action.
5. Give a short business outlook.
6. Keep the language practical and concise.
7. Do not give legal, tax, or investment advice.

Return a structured response with:
- summary
- riskExplanation
- priorityAction
- outlook
"""

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=AIAnalysisResponse,
        ),
    )

    return AIAnalysisResponse.model_validate_json(response.text)