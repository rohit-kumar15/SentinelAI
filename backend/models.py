from pydantic import BaseModel, Field
from typing import List, Dict
from datetime import datetime


# ────────────────────────────────────────────────────────────
# Sub-models
# ────────────────────────────────────────────────────────────

class Asset(BaseModel):
    subdomain: str
    ip: str
    ports: List[int]
    risk: int
    severity: str  # "high" | "medium" | "low"


class SeverityDistribution(BaseModel):
    high: int
    medium: int
    low: int


# ────────────────────────────────────────────────────────────
# MongoDB document shape
# ────────────────────────────────────────────────────────────

class ScanDocument(BaseModel):
    domain: str
    assets: List[Asset]
    risk_score: int
    severity_distribution: SeverityDistribution
    ai_summary: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


# ────────────────────────────────────────────────────────────
# API request / response models
# ────────────────────────────────────────────────────────────

class ScanRequest(BaseModel):
    domain: str


class ScanResponse(BaseModel):
    scan_id: str
    status: str


class ResultResponse(BaseModel):
    domain: str
    assets: List[Asset]
    risk_score: int
    severity_distribution: SeverityDistribution
    ai_summary: str


class AttackRequest(BaseModel):
    scan_id: str


class AttackResponse(BaseModel):
    attack_narrative: str
