# SentenalAI — Attack Surface Intelligence Platform

An MVP cybersecurity tool that discovers subdomains, scores risk exposure, generates AI-powered security summaries, and simulates red-team attacker narratives.

---

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Frontend | React 19 · Vite · Recharts · react-force-graph-2d · Axios |
| Backend  | Python FastAPI · uvicorn                      |
| Database | MongoDB Atlas (with in-memory fallback)       |
| AI       | Google Gemini API                             |

---

## Prerequisites

- **Node.js** ≥ 18 and **npm**
- **Python** ≥ 3.10
- A **MongoDB Atlas** URI (optional — falls back to in-memory store)
- A **Google Gemini API key** (optional — falls back to static summary)

---

## Setup

### 1. Clone / open the project

```
cd SentenalAI
```

### 2. Backend

```bash
cd backend

# Create a virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and fill in MONGODB_URI and GEMINI_API_KEY
```

**.env** format:
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/sentenalai
GEMINI_API_KEY=AIza...
```

### 3. Frontend

```bash
cd ../frontend
npm install
```

---

## Running Locally

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate
python main.py
# API running at http://localhost:8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# UI running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Usage

1. Enter a domain (e.g. `github.com`) in the search bar and click **⚡ Analyze**.
2. Wait for the scan to complete (typically 5–15 seconds).
3. Review the **Dashboard**:
   - **Overall Risk Score** — 0–100 composite score
   - **Severity Distribution** — Radar + bar charts
   - **AI Security Summary** — Gemini-generated analysis
   - **Asset Table** — Sortable, filterable subdomain list
   - **Attack Surface Graph** — Interactive force-directed node graph
4. Click **⚡ Run Attack Simulation** for a red-team attacker narrative.

---

## API Endpoints

| Method | Endpoint                  | Description                        |
|--------|---------------------------|------------------------------------|
| GET    | `/health`                 | Health check                       |
| POST   | `/scan`                   | Start a new domain scan            |
| GET    | `/result/{scan_id}`       | Retrieve scan results              |
| POST   | `/simulate-attack`        | Generate attack narrative          |

### POST `/scan`
```json
{ "domain": "example.com" }
```
Response:
```json
{ "scan_id": "...", "status": "complete" }
```

### POST `/simulate-attack`
```json
{ "scan_id": "..." }
```
Response:
```json
{ "attack_narrative": "..." }
```

---

## Project Structure

```
SentenalAI/
├── backend/
│   ├── ai/
│   │   └── summarizer.py       # Gemini AI integration
│   ├── recon/
│   │   └── subdomain_scanner.py# DNS + CT log subdomain discovery
│   ├── risk/
│   │   └── scoring.py          # Risk scoring engine
│   ├── database.py             # MongoDB connection
│   ├── models.py               # Pydantic request/response models
│   ├── main.py                 # FastAPI app + routes
│   ├── requirements.txt
│   ├── .env.example
│   └── .env                    # (create from .env.example)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── DomainInput.jsx
    │   │   ├── RiskHeatmap.jsx
    │   │   ├── AssetTable.jsx
    │   │   ├── AttackGraph.jsx
    │   │   ├── AISummary.jsx
    │   │   └── AttackSimulation.jsx
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   └── Dashboard.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    └── package.json
```

---

## Notes

- If no MongoDB URI is provided, scans are stored **in-memory** and lost on server restart.
- If no Gemini API key is provided, the AI summary falls back to a static templated text.
- The subdomain scanner uses DNS enumeration + crt.sh certificate transparency logs — no API keys required.
