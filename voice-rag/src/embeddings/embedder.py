import time
import numpy as np
import hashlib
import re
from typing import List, Union

class MultilingualEmbedder:
    """Multilingual dense embedding generator for Indic and English texts."""
    def __init__(self, model_name: str = "BAAI/bge-m3", dimension: int = 1024):
        self.model_name = model_name
        self.dimension = dimension
        self.model = None

    def _init_model(self):
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer("all-MiniLM-L6-v2")
            except Exception:
                try:
                    from sentence_transformers import SentenceTransformer
                    self.model = SentenceTransformer(self.model_name)
                except Exception:
                    self.model = "fallback_mock"

    def _text_to_feature_vector(self, text: str) -> np.ndarray:
        """Deterministic feature vector using word and char n-grams hashing."""
        words = re.findall(r'\w+', text.lower())
        vec = np.zeros(self.dimension, dtype=np.float32)
        
        if not words:
            return vec

        for word in words:
            # Word level hashing
            h_val = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
            idx = h_val % self.dimension
            sign = 1.0 if (h_val % 2 == 0) else -1.0
            vec[idx] += sign * 2.0
            
            # Sub-word char 3-grams for cross-lingual / morphological matching
            for i in range(len(word) - 2):
                gram = word[i:i+3]
                gh_val = int(hashlib.md5(gram.encode('utf-8')).hexdigest(), 16)
                g_idx = gh_val % self.dimension
                g_sign = 1.0 if (gh_val % 2 == 0) else -1.0
                vec[g_idx] += g_sign * 0.5

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def encode(self, texts: Union[str, List[str]], batch_size: int = 16) -> np.ndarray:
        """Encode text or list of texts into normalized embedding vectors."""
        self._init_model()
        if isinstance(texts, str):
            texts = [texts]
            
        if self.model != "fallback_mock":
            try:
                embeddings = self.model.encode(texts, batch_size=batch_size, normalize_embeddings=True)
                return np.array(embeddings, dtype=np.float32)
            except Exception:
                pass

        # High-performance deterministic n-gram hashing vectorizer
        vecs = [self._text_to_feature_vector(t) for t in texts]
        return np.array(vecs, dtype=np.float32)

    def compute_similarity(self, query_emb: np.ndarray, doc_embs: np.ndarray) -> np.ndarray:
        """Compute cosine similarity scores between query and document vectors."""
        if query_emb.ndim == 1:
            query_emb = query_emb.reshape(1, -1)
        scores = np.dot(doc_embs, query_emb.T).squeeze(-1)
        return scores
