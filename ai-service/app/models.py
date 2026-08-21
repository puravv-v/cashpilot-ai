from pydantic import BaseModel
from typing import List


class Risk(BaseModel):
    riskDetected: bool
    severity: str
    riskDate: str | None = None
    projectedBalance: float | None = None
    message: str
    primaryCause: str | None = None


class Recommendation(BaseModel):
    priority: str
    title: str
    reason: str
    action: str


class AIAnalysisRequest(BaseModel):
    currentCash: float
    risk: Risk
    recommendations: List[Recommendation]


class AIAnalysisResponse(BaseModel):
    summary: str
    riskExplanation: str
    priorityAction: str
    outlook: str