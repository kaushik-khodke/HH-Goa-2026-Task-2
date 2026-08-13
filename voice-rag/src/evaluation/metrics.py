import math
import numpy as np
from typing import List, Dict, Any, Union

def calculate_recall_at_k(retrieved_ids: List[Union[str, int]], ground_truth_ids: List[Union[str, int]], k: int) -> float:
    """Calculate Recall@K."""
    if not ground_truth_ids:
        return 0.0
    top_k_retrieved = set(retrieved_ids[:k])
    gt_set = set(ground_truth_ids)
    hits = len(top_k_retrieved.intersection(gt_set))
    return hits / len(gt_set)

def calculate_precision_at_k(retrieved_ids: List[Union[str, int]], ground_truth_ids: List[Union[str, int]], k: int) -> float:
    """Calculate Precision@K."""
    if k <= 0 or not retrieved_ids:
        return 0.0
    top_k_retrieved = retrieved_ids[:k]
    gt_set = set(ground_truth_ids)
    hits = sum(1 for item in top_k_retrieved if item in gt_set)
    return hits / k

def calculate_mrr_at_k(retrieved_ids: List[Union[str, int]], ground_truth_ids: List[Union[str, int]], k: int = 10) -> float:
    """Calculate Mean Reciprocal Rank (MRR@K)."""
    gt_set = set(ground_truth_ids)
    top_k = retrieved_ids[:k]
    for rank_idx, item in enumerate(top_k, start=1):
        if item in gt_set:
            return 1.0 / rank_idx
    return 0.0

def calculate_dcg_at_k(retrieved_ids: List[Union[str, int]], ground_truth_ids: List[Union[str, int]], k: int = 10) -> float:
    """Calculate Discounted Cumulative Gain (DCG@K)."""
    gt_set = set(ground_truth_ids)
    dcg = 0.0
    for i, item in enumerate(retrieved_ids[:k], start=1):
        rel = 1.0 if item in gt_set else 0.0
        dcg += rel / math.log2(i + 1)
    return dcg

def calculate_ndcg_at_k(retrieved_ids: List[Union[str, int]], ground_truth_ids: List[Union[str, int]], k: int = 10) -> float:
    """Calculate Normalized Discounted Cumulative Gain (nDCG@K)."""
    dcg = calculate_dcg_at_k(retrieved_ids, ground_truth_ids, k)
    ideal_hits = min(len(ground_truth_ids), k)
    idcg = sum(1.0 / math.log2(i + 1) for i in range(1, ideal_hits + 1))
    if idcg == 0.0:
        return 0.0
    return dcg / idcg

def calculate_latency_percentiles(latencies_ms: List[float]) -> Dict[str, float]:
    """Calculate Average, P50, P70, P95, and P100 (Max) latency metrics."""
    if not latencies_ms:
        return {"avg": 0.0, "p50": 0.0, "p70": 0.0, "p95": 0.0, "p100": 0.0}
    
    arr = np.array(latencies_ms)
    return {
        "avg": float(np.mean(arr)),
        "p50": float(np.percentile(arr, 50)),
        "p70": float(np.percentile(arr, 70)),
        "p95": float(np.percentile(arr, 95)),
        "p100": float(np.max(arr))
    }

class RetrievalEvaluator:
    """Batch evaluator for retrieval runs."""
    def __init__(self, k_values: List[int] = [1, 5, 10]):
        self.k_values = k_values

    def evaluate_run(
        self, 
        retrieval_results: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """
        `retrieval_results` is a list of dicts:
        [
           {
              "retrieved_ids": [id1, id2, ...],
              "ground_truth_ids": [gt1, ...],
              "latency_ms": 12.4
           }, ...
        ]
        """
        metrics = {f"Recall@{k}": [] for k in self.k_values}
        metrics.update({f"Precision@{k}": [] for k in self.k_values})
        metrics["MRR@10"] = []
        metrics["nDCG@10"] = []
        latencies = []

        for item in retrieval_results:
            ret = item["retrieved_ids"]
            gt = item["ground_truth_ids"]
            lat = item.get("latency_ms", 0.0)
            latencies.append(lat)

            for k in self.k_values:
                metrics[f"Recall@{k}"].append(calculate_recall_at_k(ret, gt, k))
                metrics[f"Precision@{k}"].append(calculate_precision_at_k(ret, gt, k))

            metrics["MRR@10"].append(calculate_mrr_at_k(ret, gt, 10))
            metrics["nDCG@10"].append(calculate_ndcg_at_k(ret, gt, 10))

        summary = {}
        for k, values in metrics.items():
            summary[k] = float(np.mean(values)) if values else 0.0

        lat_perc = calculate_latency_percentiles(latencies)
        for p_name, p_val in lat_perc.items():
            summary[f"latency_{p_name}_ms"] = p_val

        return summary
