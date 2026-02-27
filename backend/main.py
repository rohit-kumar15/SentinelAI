from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from datetime import datetime
import uvicorn

from database import connect_db, get_scans_collection
from models import ScanRequest, ScanResponse, AttackRequest, AttackResponse
from recon.subdomain_scanner import scan_domain
from risk.scoring import run_risk_engine
from ai.summarizer import generate_summary, generate_attack_narrative

# ─────────────────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────────────────

app = FastAPI(
    title="SentenalAI",
    description="Attack Surface Intelligence API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory fallback store (used when MongoDB is not configured)
_memory_store: dict = {}


# ─────────────────────────────────────────────────────────
# Startup
# ─────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    connect_db()


# ─────────────────────────────────────────────────────────
# Health check
# ─────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "SentenalAI API running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}


# ─────────────────────────────────────────────────────────
# POST /scan
# ─────────────────────────────────────────────────────────

@app.post("/scan", response_model=ScanResponse)
async def start_scan(req: ScanRequest):
    """Trigger a full attack surface scan for a domain."""
    domain = req.domain.strip().lower()
    if not domain:
        raise HTTPException(status_code=400, detail="Domain is required.")

    # Remove protocol prefix if user accidentally includes it
    for prefix in ("https://", "http://", "www."):
        if domain.startswith(prefix):
            domain = domain[len(prefix):]

    # 1. Recon
    raw_assets = scan_domain(domain)

    # 2. Risk scoring
    scored_assets, risk_score, severity_dist = run_risk_engine(raw_assets)

    # 3. AI summary
    ai_summary = generate_summary(domain, scored_assets, risk_score, severity_dist)

    # 4. Build MongoDB document
    doc = {
        "domain": domain,
        "assets": scored_assets,
        "risk_score": risk_score,
        "severity_distribution": severity_dist,
        "ai_summary": ai_summary,
        "created_at": datetime.utcnow(),
    }

    # 5. Persist
    collection = get_scans_collection()
    if collection is not None:
        result = collection.insert_one(doc)
        scan_id = str(result.inserted_id)
    else:
        # In-memory fallback
        import uuid
        scan_id = str(uuid.uuid4())
        _memory_store[scan_id] = doc
        print(f"[INFO] Stored scan in memory with id={scan_id}")

    return ScanResponse(scan_id=scan_id, status="complete")


# ─────────────────────────────────────────────────────────
# GET /result/{scan_id}
# ─────────────────────────────────────────────────────────

@app.get("/result/{scan_id}")
async def get_result(scan_id: str):
    """Retrieve a completed scan result."""
    doc = None
    collection = get_scans_collection()

    if collection is not None:
        try:
            doc = collection.find_one({"_id": ObjectId(scan_id)})
        except Exception:
            # scan_id might be a non-ObjectId string (shouldn't happen in normal flow)
            pass

    # Check in-memory store as fallback
    if doc is None:
        doc = _memory_store.get(scan_id)

    if not doc:
        raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found.")

    return {
        "domain": doc["domain"],
        "assets": doc["assets"],
        "risk_score": doc["risk_score"],
        "severity_distribution": doc["severity_distribution"],
        "ai_summary": doc["ai_summary"],
    }


# ─────────────────────────────────────────────────────────
# POST /simulate-attack
# ─────────────────────────────────────────────────────────

@app.post("/simulate-attack", response_model=AttackResponse)
async def simulate_attack(req: AttackRequest):
    """Generate an attacker simulation narrative for a completed scan."""
    doc = None
    collection = get_scans_collection()

    if collection is not None:
        try:
            doc = collection.find_one({"_id": ObjectId(req.scan_id)})
        except Exception:
            pass

    if doc is None:
        doc = _memory_store.get(req.scan_id)

    if not doc:
        raise HTTPException(status_code=404, detail=f"Scan '{req.scan_id}' not found.")

    narrative = generate_attack_narrative(
        domain=doc["domain"],
        assets=doc["assets"],
        risk_score=doc["risk_score"],
    )

    return AttackResponse(attack_narrative=narrative)


# ─────────────────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
