from typing import List, Dict, Any, Tuple

class ReciprocalRankFusion:
    """Combines BM25 and Dense Retrieval rankings using Reciprocal Rank Fusion (RRF)."""
    def __init__(self, k: int = 60):
        self.k = k

    def fuse(
        self, 
        sparse_results: List[Tuple[Dict[str, Any], float]], 
        dense_results: List[Tuple[Dict[str, Any], float]], 
        top_k: int = 10
    ) -> List[Tuple[Dict[str, Any], float]]:
        
        score_map: Dict[str, float] = {}
        passage_map: Dict[str, Dict[str, Any]] = {}
        
        # Process sparse rankings
        for rank, (passage, score) in enumerate(sparse_results, start=1):
            pid = str(passage.get("passage_id", passage.get("text")))
            rrf_score = 1.0 / (self.k + rank)
            score_map[pid] = score_map.get(pid, 0.0) + rrf_score
            passage_map[pid] = passage

        # Process dense rankings
        for rank, (passage, score) in enumerate(dense_results, start=1):
            pid = str(passage.get("passage_id", passage.get("text")))
            rrf_score = 1.0 / (self.k + rank)
            score_map[pid] = score_map.get(pid, 0.0) + rrf_score
            passage_map[pid] = passage

        # Sort combined results by fused score
        sorted_pids = sorted(score_map.keys(), key=lambda pid: score_map[pid], reverse=True)[:top_k]
        fused_results = [(passage_map[pid], score_map[pid]) for pid in sorted_pids]
        return fused_results
