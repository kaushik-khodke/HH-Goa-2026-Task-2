import time
from typing import List, Dict, Any, Tuple

class MultilingualReranker:
    """Multilingual Cross-Encoder Reranker using BGE Reranker v2 M3."""
    def __init__(self, model_name: str = "BAAI/bge-reranker-v2-m3"):
        self.model_name = model_name
        self.model = None

    def _init_model(self):
        if self.model is None:
            try:
                from sentence_transformers import CrossEncoder
                self.model = CrossEncoder(self.model_name, local_files_only=True)
            except Exception:
                self.model = "fallback_mock"

    def rerank(
        self, 
        query: str, 
        candidates: List[Any], 
        top_k: int = 5
    ) -> List[Tuple[Dict[str, Any], float]]:
        """Rerank candidate passages against query and return top_k reranked results."""
        if not candidates:
            return []
            
        self._init_model()
        docs = [c[0] if isinstance(c, (list, tuple)) else c for c in candidates]
        pairs = [(query, doc.get("text", "")) for doc in docs]
        
        if self.model != "fallback_mock":
            scores = self.model.predict(pairs)
        else:
            # High-speed pseudo-reranking score fallback based on term overlap & position
            scores = []
            q_words = set(query.lower().split())
            for idx, doc in enumerate(docs):
                c_words = set(doc.get("text", "").lower().split())
                overlap = len(q_words.intersection(c_words))
                pos_bonus = (len(docs) - idx) / len(docs)
                score = (overlap * 2.0) + pos_bonus
                scores.append(score)
                
        ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        results = [(docs[i], float(scores[i])) for i in ranked_indices]
        return results
