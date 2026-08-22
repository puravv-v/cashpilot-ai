from pydantic import BaseModel
from typing import Optional


class Risk(BaseModel):
    riskDetected: bool
    severity: str
    riskDate: Optional[str] = None
    projectedBalance: Optional[float] = None
    message: str
    primaryCause: Optional[str] = None


class AIAnalysisRequest(BaseModel):
    currentCash: float
    risk: Risk
    recommendations: list = []


class AIAnalysisResponse(BaseModel):
    summary: str
    riskExplanation: str
    priorityAction: str
    outlook: str