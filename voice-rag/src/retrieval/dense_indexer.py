import os
import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional

from src.embeddings.embedder import MultilingualEmbedder
from src.config.config import FAISS_INDEX_DIR

class FaissDenseIndexer:
    """
    Local Vector Database Indexer:
    Builds, persists, and queries dense vector embeddings locally on disk in indexes/faiss/.
    """
    def __init__(self, index_dir: Optional[Path] = None, dimension: int = 1024):
        self.index_dir = Path(index_dir) if index_dir else FAISS_INDEX_DIR
        self.index_dir.mkdir(parents=True, exist_ok=True)
        self.dimension = dimension
        self.embedder = MultilingualEmbedder(dimension=dimension)
        
        self.vectors_file = self.index_dir / "dense_vectors.npy"
        self.index_file = self.index_dir / "msmarco_xi.index"
        self.meta_file = self.index_dir / "index_metadata.json"
        
        self.vectors: Optional[np.ndarray] = None
        self.passages: List[Dict[str, Any]] = []

    def build_and_save(self, corpus_passages: List[Dict[str, Any]]) -> int:
        """Encode all passages, build dense vectors, and persist locally to indexes/faiss/."""
        if not corpus_passages:
            return 0

        self.passages = corpus_passages
        texts = [p.get("text", "") for p in corpus_passages]
        
        # Compute normalized dense embeddings
        self.vectors = np.array([self.embedder._text_to_feature_vector(t) for t in texts], dtype=np.float32)

        # 1. Save dense vectors matrix locally to disk (.npy)
        np.save(str(self.vectors_file), self.vectors)

        # 2. Save metadata locally to disk (.json)
        with open(self.meta_file, "w", encoding="utf-8") as f:
            json.dump(self.passages, f, ensure_ascii=False, indent=2)

        # 3. Save binary vector index format (.index)
        try:
            import faiss
            index = faiss.IndexFlatIP(self.dimension)
            faiss.normalize_L2(self.vectors)
            index.add(self.vectors)
            faiss.write_index(index, str(self.index_file))
        except Exception:
            # Write structured binary index header fallback
            with open(self.index_file, "wb") as f:
                header = f"FAISS_FLAT_IP_DIM_{self.dimension}_VECTORS_{len(self.vectors)}\n".encode('utf-8')
                f.write(header)
                f.write(self.vectors.tobytes())

        print(f"=== Vector DB Persisted: {len(self.passages)} vectors saved to {self.index_dir} ===")
        return len(self.passages)

    def load_index(self) -> bool:
        """Load locally persisted vector database from indexes/faiss/."""
        if self.vectors_file.exists() and self.meta_file.exists():
            try:
                self.vectors = np.load(str(self.vectors_file))
                with open(self.meta_file, "r", encoding="utf-8") as f:
                    self.passages = json.load(f)
                return True
            except Exception as e:
                print(f"Notice: Failed to load local vector index: {e}")
        return False

    def search(self, query: str, top_k: int = 10) -> List[Tuple[Dict[str, Any], float]]:
        """Search local vector database for nearest semantic matches."""
        if self.vectors is None or len(self.passages) == 0:
            if not self.load_index():
                return []

        q_vec = self.embedder._text_to_feature_vector(query)
        scores = np.dot(self.vectors, q_vec)
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            results.append((self.passages[idx], float(scores[idx])))
        return results
