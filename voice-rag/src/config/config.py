import os
from pathlib import Path
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
EVAL_DATA_DIR = DATA_DIR / "evaluation"

INDEXES_DIR = BASE_DIR / "indexes"
FAISS_INDEX_DIR = INDEXES_DIR / "faiss"
BM25_INDEX_DIR = INDEXES_DIR / "bm25"
MODELS_DIR = BASE_DIR / "models"

class Settings(BaseModel):
    # Dataset Config
    dataset_name: str = "ai4bharat/MSMARCO-XI"
    default_languages: list[str] = ["hi", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "ur"]
    
    # API Keys
    sarvam_api_key: str = os.getenv("SARVAM_API_KEY", "")
    elevenlabs_api_key: str = os.getenv("ELEVENLABS_API_KEY", "")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    grok_api_key: str = os.getenv("GROK_API_KEY", os.getenv("XAI_API_KEY", ""))
    hf_token: str = os.getenv("HF_TOKEN", "")
    
    # Model Choice Defaults & Fallback Sequence
    embedding_model_name: str = "BAAI/bge-m3"
    reranker_model_name: str = "BAAI/bge-reranker-v2-m3"
    primary_generation_model: str = os.getenv("PRIMARY_GENERATION_MODEL", "gemini-3.5-flash-lite")
    fallback_generation_models: list[str] = [
        m.strip()
        for m in os.getenv(
            "FALLBACK_GENERATION_MODELS",
            "llama-3.3-70b-versatile,gemini-3.5-flash,gemini-3.6-flash,gemini-2.5-flash",
        ).split(",")
        if m.strip()
    ]
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    
    # Retrieval Hyperparameters
    bm25_k1: float = 1.5
    bm25_b: float = 0.75
    rrf_k: int = 60
    top_k_retrieval: int = 20
    top_k_rerank: int = 5
    
    # Latency Target (ms)
    target_latency_ms: float = 200.0

settings = Settings()

if settings.hf_token:
    os.environ["HF_TOKEN"] = settings.hf_token
    os.environ["HUGGINGFACE_HUB_TOKEN"] = settings.hf_token
