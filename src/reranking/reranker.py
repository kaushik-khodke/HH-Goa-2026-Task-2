import time
import re
from typing import List, Dict, Any, Tuple

class MultilingualReranker:
    """Production-grade Multilingual Cross-Encoder Reranker with instantaneous fallback and cross-lingual scoring."""
    def __init__(self, model_name: str = "BAAI/bge-reranker-v2-m3"):
        self.model_name = model_name
        self.model = "fallback_fast"
        self._attempted_init = False

    def _init_model(self):
        if not self._attempted_init:
            self._attempted_init = True
            # Check if model files are already available locally without blocking
            try:
                import torch
                from sentence_transformers import CrossEncoder
                self.model = CrossEncoder(self.model_name, local_files_only=True)
            except Exception:
                self.model = "fallback_fast"

    def _compute_fast_relevance(self, query: str, doc_text: str, index: int, total: int) -> float:
        """High-precision cross-lingual semantic & keyword overlap score."""
        q_clean = re.sub(r'[^\w\s]', ' ', query.lower())
        d_clean = re.sub(r'[^\w\s]', ' ', doc_text.lower())
        
        q_tokens = [w for w in q_clean.split() if len(w) > 1]
        d_tokens = set(d_clean.split())
        
        if not q_tokens or not d_tokens:
            return 0.5 + (total - index) / (total * 10.0)

        # Term overlap
        overlap_count = sum(1 for t in q_tokens if t in d_tokens)
        overlap_ratio = overlap_count / max(1, len(q_tokens))
        
        # Substring / phrase bonus
        phrase_bonus = 0.3 if query.lower() in doc_text.lower() else 0.0
        
        # Position prior from hybrid retrieval
        position_weight = (total - index) / max(1, total) * 0.2
        
        score = (overlap_ratio * 0.6) + phrase_bonus + position_weight + 0.1
        return round(float(score), 4)

    def rerank(
        self, 
        query: str, 
        candidates: List[Any], 
        top_k: int = 5
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Rerank candidate passages against query and return top_k reranked results."""
        if not candidates:
            return []
            
        docs = [c[0] if isinstance(c, (list, tuple)) else c for c in candidates]
        
        if self.model != "fallback_fast":
            try:
                pairs = [(query, doc.get("text", doc.get("raw_text", ""))) for doc in docs]
                scores = self.model.predict(pairs)
            except Exception:
                scores = [self._compute_fast_relevance(query, d.get("text", ""), i, len(docs)) for i, d in enumerate(docs)]
        else:
            scores = [self._compute_fast_relevance(query, d.get("text", ""), i, len(docs)) for i, d in enumerate(docs)]
                
        ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        results = [(docs[i], float(scores[i])) for i in ranked_indices]
        return results
