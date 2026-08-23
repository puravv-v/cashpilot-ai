from typing import List, Optional

from pydantic import BaseModel, Field


class Risk(BaseModel):

    riskDetected: bool

    severity: str

    riskDate: Optional[str] = None

    projectedBalance: Optional[float] = None

    message: str

    primaryCause: Optional[str] = None


class Projection(BaseModel):

    date: str

    cashBalance: float

    change: float

    description: Optional[str] = None


class Recommendation(BaseModel):

    priority: Optional[str] = None

    title: Optional[str] = None

    reason: Optional[str] = None

    action: Optional[str] = None


class CashFlowScenario(BaseModel):

    type: str

    available: bool

    title: Optional[str] = None

    explanation: Optional[str] = None

    firstDate: Optional[str] = None

    secondDate: Optional[str] = None

    firstDescription: Optional[str] = None

    secondDescription: Optional[str] = None

    firstAmount: Optional[float] = None

    secondAmount: Optional[float] = None

    originalLowestBalance: Optional[float] = None

    originalLowestBalanceDate: Optional[str] = None

    scenarioLowestBalance: Optional[float] = None

    scenarioLowestBalanceDate: Optional[str] = None


class AIAnalysisRequest(BaseModel):

    currentCash: float

    startingCash: Optional[float] = None

    totalIncome: Optional[float] = None

    totalExpenses: Optional[float] = None

    projection: List[Projection] = Field(
        default_factory=list
    )

    risk: Risk

    recommendations: List[Recommendation] = Field(
        default_factory=list
    )

    goodScenario: Optional[CashFlowScenario] = None

    badScenario: Optional[CashFlowScenario] = None


class AIAnalysisResponse(BaseModel):

    summary: str

    riskExplanation: str

    businessPattern: str

    priorityAction: str

    outlook: str

    goodScenario: str

    badScenario: str