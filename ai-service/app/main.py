from fastapi import FastAPI

from .models import AIAnalysisRequest, AIAnalysisResponse
from .ai import analyze_finances


app = FastAPI(
    title="CashPilot AI Service",
    version="1.0.0"
)


@app.get("/health")
def health():
    return {
        "status": "UP",
        "service": "cashpilot-ai"
    }


@app.post("/api/ai/analyze", response_model=AIAnalysisResponse)
def analyze(data: AIAnalysisRequest):
    return analyze_finances(data)