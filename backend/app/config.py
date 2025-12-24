import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'biopass_swarm')
BIOPASS_API_URL = os.environ.get('BIOPASS_API_URL', 'https://cmj1nqwjn7tk4yprgudqvroco.agent.pa.smyth.ai')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
