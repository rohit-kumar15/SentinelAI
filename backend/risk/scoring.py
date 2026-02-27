from typing import List, Dict, Tuple

# ─────────────────────────────────────────────────────────
# Scoring constants
# ─────────────────────────────────────────────────────────

HIGH_RISK_KEYWORDS = {
    "admin", "test", "dev", "staging", "debug",
    "internal", "backup", "old", "demo", "vpn",
    "remote", "secret", "legacy", "temp", "jenkins",
    "git", "gitlab", "jira", "confluence",
}

# Ports that indicate significant exposure
RISKY_PORTS = {22, 21, 23, 3306, 5432, 6379, 27017, 8080, 3389, 8443}

# Ports that have mild risk
MILD_RISK_PORTS = {25, 110, 143, 9200, 8888}


# ─────────────────────────────────────────────────────────
# Individual asset scorer
# ─────────────────────────────────────────────────────────

def score_asset(asset: Dict) -> Dict:
    """
    Score a single asset.
    Returns the asset dict augmented with 'risk' (0-100) and 'severity'.
    """
    score = 15  # baseline risk for any public-facing asset
    subdomain = asset["subdomain"].lower()
    ports = set(asset.get("ports", []))
    shodan = asset.get("shodan_data", {})

    # ── Keyword-based risk ──────────────────────────────
    for keyword in HIGH_RISK_KEYWORDS:
        if keyword in subdomain.split(".")[0]:
            score += 25
            break

    # ── Port-based risk ──────────────────────────────────
    risky_hits = RISKY_PORTS.intersection(ports)
    mild_hits = MILD_RISK_PORTS.intersection(ports)
    score += len(risky_hits) * 15
    score += len(mild_hits) * 5

    # ── Shodan Intelligence ─────────────────────────────
    if shodan:
        # Vulnerabilities are high-risk
        vulns = shodan.get("vulns", [])
        score += len(vulns) * 12

        # OS Intelligence (End of Life or Legacy OS)
        os_info = shodan.get("os", "")
        if os_info:
            os_lower = os_info.lower()
            if any(x in os_lower for x in ["2008", "2003", "xp", "windows 7", "windows 8"]):
                score += 30
            elif "linux" in os_lower:
                score += 5 # General OS detection baseline

        # Service Data Analysis (looking for high-risk headers/signatures)
        banners = shodan.get("data", [])
        for banner in banners:
            data_str = str(banner.get("data", "")).lower()
            if any(match in data_str for match in ["thinkphp", "magento", "log4j", "eternalblue"]):
                score += 35

    # ── SSL-only asset (443 with no risky ports) is safer ─
    if ports == {80, 443} or ports == {443}:
        score -= 5

    # ── Clamp ────────────────────────────────────────────
    score = max(0, min(100, score))

    if score >= 70:
        severity = "high"
    elif score >= 35:
        severity = "medium"
    else:
        severity = "low"

    return {
        **asset,
        "risk": score,
        "severity": severity,
    }


# ─────────────────────────────────────────────────────────
# Aggregate risk engine
# ─────────────────────────────────────────────────────────

def compute_overall_risk(scored_assets: List[Dict]) -> Tuple[int, Dict]:
    """
    Compute an aggregate risk score and severity distribution.
    High-severity assets add a bonus to reflect amplified real-world risk.
    """
    dist = {"high": 0, "medium": 0, "low": 0}
    if not scored_assets:
        return 0, dist

    total_risk = 0
    for a in scored_assets:
        dist[a["severity"]] += 1
        total_risk += a["risk"]

    average = total_risk // len(scored_assets)

    # High-severity presence bonus
    high_bonus = min(dist["high"] * 4, 20)
    overall = min(100, average + high_bonus)

    return overall, dist


# ─────────────────────────────────────────────────────────
# Main entry point
# ─────────────────────────────────────────────────────────

def run_risk_engine(assets: List[Dict]) -> Tuple[List[Dict], int, Dict]:
    """
    Run the full risk engine:
      1. Score each asset
      2. Compute aggregate score and distribution
    Returns (scored_assets, risk_score, severity_distribution).
    """
    scored = [score_asset(a) for a in assets]
    risk_score, dist = compute_overall_risk(scored)
    print(f"[INFO] Risk engine complete — score={risk_score}, dist={dist}")
    return scored, risk_score, dist
