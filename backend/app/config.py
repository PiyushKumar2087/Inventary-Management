import os
import json
from pathlib import Path
from dotenv import load_dotenv

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"
print(f'env file : {_ENV_FILE}')

if _ENV_FILE.exists():
    load_dotenv(dotenv_path=_ENV_FILE)

class Settings:
    def __init__(self):
        self.DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/inventory_db")
        
        cors_origins_raw = os.getenv("CORS_ORIGINS")
        if cors_origins_raw:
            try:
                self.CORS_ORIGINS = json.loads(cors_origins_raw)
            except Exception:
                self.CORS_ORIGINS = [cors_origins_raw]
        else:
            self.CORS_ORIGINS = ["*"]

settings = Settings()
