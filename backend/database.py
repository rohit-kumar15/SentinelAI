import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "")

client = None
db = None
scans_collection = None


def connect_db() -> bool:
    global client, db, scans_collection

    if not MONGO_URI:
        print("[WARNING] MONGO_URI not set. Running in memory-only mode.")
        return False

    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Ping to confirm connection
        client.admin.command("ping")
        db = client["sentenalai"]
        scans_collection = db["scans"]
        print("[INFO] Connected to MongoDB successfully.")
        return True
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        print("[WARNING] Falling back to in-memory storage.")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected DB error: {e}")
        return False


def get_scans_collection():
    """Return the scans collection, or None if not connected."""
    return scans_collection
