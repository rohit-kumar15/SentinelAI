import requests
import socket
import random
import os
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

SHODAN_API_KEY = os.getenv("SHODAN_API_KEY", "").strip()

# ─────────────────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────────────────

COMMON_PORTS = [80, 443, 22, 8080, 3306, 5432, 8443, 21, 25, 3389, 6379, 27017]

MOCK_PREFIXES = [
    "www", "mail", "dev", "api", "staging", "admin",
    "test", "cdn", "vpn", "remote", "app", "portal",
    "ftp", "secure", "internal",
]


# ─────────────────────────────────────────────────────────
# Subdomain discovery via crt.sh
# ─────────────────────────────────────────────────────────

def fetch_subdomains_crtsh(domain: str) -> Optional[List[str]]:
    """
    Query crt.sh certificate transparency logs.
    Returns a deduplicated list of subdomains, or None on failure.
    """
    try:
        url = f"https://crt.sh/?q=%.{domain}&output=json"
        resp = requests.get(url, timeout=15, headers={"User-Agent": "SentenalAI/1.0"})
        resp.raise_for_status()
        data = resp.json()

        subdomains: set = set()
        for entry in data:
            name_value = entry.get("name_value", "")
            for name in name_value.split("\n"):
                name = name.strip().lstrip("*.")
                # Only keep subdomains that actually belong to the target domain
                if name and name.endswith(domain) and name != domain:
                    subdomains.add(name.lower())

        result = list(subdomains)
        print(f"[INFO] crt.sh returned {len(result)} subdomains for {domain}")
        return result[:30]  # Cap at 30 for MVP speed

    except Exception as e:
        print(f"[WARN] crt.sh lookup failed for {domain}: {e}. Falling back to mock data.")
        return None


# ─────────────────────────────────────────────────────────
# Fallback: mock subdomains
# ─────────────────────────────────────────────────────────

def generate_mock_subdomains(domain: str) -> List[str]:
    """Return realistic-looking mock subdomains when crt.sh is unavailable."""
    return [f"{prefix}.{domain}" for prefix in MOCK_PREFIXES]


# ─────────────────────────────────────────────────────────
# IP resolution
# ─────────────────────────────────────────────────────────

def resolve_ip(subdomain: str) -> str:
    """
    Attempt to resolve the subdomain's IP.
    Returns a mock IP if resolution fails.
    """
    try:
        ip = socket.gethostbyname(subdomain)
        return ip
    except (socket.gaierror, socket.timeout):
        # Deterministic mock IP so same subdomain always gets same IP
        rng = random.Random(hash(subdomain) % (2 ** 32))
        return f"192.168.{rng.randint(1, 254)}.{rng.randint(1, 254)}"


# ─────────────────────────────────────────────────────────
# Port simulation (deterministic per subdomain)
# ─────────────────────────────────────────────────────────

def simulate_ports(subdomain: str) -> List[int]:
    """
    Simulate open ports using a seeded RNG so results are
    deterministic for the same subdomain across runs.
    """
    rng = random.Random(hash(subdomain) % (2 ** 32))
    n = rng.randint(1, 4)
    return sorted(rng.sample(COMMON_PORTS, n))


# ─────────────────────────────────────────────────────────
# Shodan Integration
# ─────────────────────────────────────────────────────────

def fetch_shodan_data(ip: str) -> Dict:
    """
    Query Shodan for information about an IP address.
    Returns a dict with ports and potential vulnerabilities.
    """
    if not SHODAN_API_KEY:
        return {}

    try:
        import shodan
        api = shodan.Shodan(SHODAN_API_KEY)
        host = api.host(ip)
        return {
            "ports": host.get("ports", []),
            "os": host.get("os"),
            "vulns": host.get("vulns", []),
            "isp": host.get("isp"),
            "data": host.get("data", [])
        }
    except Exception as e:
        print(f"[WARN] Shodan host lookup failed for {ip}: {e}")
        return {}


# ─────────────────────────────────────────────────────────
# Main scan entry point
# ─────────────────────────────────────────────────────────

def scan_domain(domain: str) -> List[Dict]:
    """
    Full scan pipeline:
      1. Discover subdomains via crt.sh (with mock fallback)
      2. Resolve IPs
      3. Fetch real Shodan data OR simulate ports
    Returns a list of asset dicts (before risk scoring).
    """
    domain = domain.strip().lower()
    subdomains = fetch_subdomains_crtsh(domain)
    if not subdomains:
        subdomains = generate_mock_subdomains(domain)
        print(f"[INFO] Using {len(subdomains)} mock subdomains for {domain}")

    # Cap at 12 assets for a fast MVP scan with Shodan
    subdomains = subdomains[:12]

    assets: List[Dict] = []
    for sub in subdomains:
        ip = resolve_ip(sub)
        
        # Prefer Shodan data if available
        shodan_info = fetch_shodan_data(ip)
        
        if shodan_info and shodan_info.get("ports"):
            ports = shodan_info["ports"]
            print(f"[INFO] Found real Shodan data for {sub} ({ip}): Ports {ports}")
        else:
            ports = simulate_ports(sub)

        assets.append({
            "subdomain": sub,
            "ip": ip,
            "ports": ports,
            "shodan_data": shodan_info  # Include for AI analysis
        })

    print(f"[INFO] Scanned {len(assets)} assets for {domain}")
    return assets
