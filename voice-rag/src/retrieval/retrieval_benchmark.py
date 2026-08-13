import time
import json
from pathlib import Path
from typing import List, Dict, Any

from src.embeddings.embedder import MultilingualEmbedder
from src.retrieval.bm25_retriever import BM25Retriever
from src.retrieval.hybrid_retriever import ReciprocalRankFusion
from src.evaluation.metrics import calculate_recall_at_k, calculate_mrr_at_k, calculate_ndcg_at_k, calculate_latency_percentiles

def run_retrieval_architecture_benchmark(eval_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compares 3 retrieval architectures:
    1. Sparse Only (BM25)
    2. Dense Only (BAAI BGE-M3)
    3. Hybrid Retrieval (BM25 + Dense via Reciprocal Rank Fusion)
    """
    embedder = MultilingualEmbedder(model_name="BAAI/bge-m3")
    rrf = ReciprocalRankFusion(k=60)

    architectures = ["BM25 Only", "Dense (BGE-M3) Only", "Hybrid (BM25 + Dense RRF)"]
    benchmark_results = {}

    for arch in architectures:
        print(f"Benchmarking Retrieval Architecture: '{arch}'...")
        recalls_1 = []
        recalls_5 = []
        recalls_10 = []
        mrrs = []
        ndcgs = []
        latencies_ms = []

        for rec in eval_records:
            query = rec["query"]
            passages = rec["passages"]
            gt_index = rec["ground_truth_index"]
            gt_passage = rec.get("ground_truth_passage", "")

            corpus = [{"passage_id": f"p_{i}", "text": p} for i, p in enumerate(passages)]
            gt_ids = [f"p_{gt_index}"]

            t0 = time.perf_counter()

            if arch == "BM25 Only":
                bm25 = BM25Retriever()
                bm25.index_corpus(corpus)
                res = bm25.retrieve(query, top_k=10)
                ret_ids = [r[0]["passage_id"] for r in res]

            elif arch == "Dense (BGE-M3) Only":
                doc_texts = [c["text"] for c in corpus]
                doc_embs = embedder.encode(doc_texts)
                q_emb = embedder.encode(query)
                scores = embedder.compute_similarity(q_emb, doc_embs)
                ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:10]
                ret_ids = [corpus[idx]["passage_id"] for idx in ranked_indices]

            else:  # Hybrid (BM25 + Dense RRF)
                bm25 = BM25Retriever()
                bm25.index_corpus(corpus)
                bm25_res = bm25.retrieve(query, top_k=10)

                doc_texts = [c["text"] for c in corpus]
                doc_embs = embedder.encode(doc_texts)
                q_emb = embedder.encode(query)
                scores = embedder.compute_similarity(q_emb, doc_embs)
                ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:10]
                dense_res = [(corpus[idx], float(scores[idx])) for idx in ranked_indices]

                fused = rrf.fuse(bm25_res, dense_res, top_k=10)
                ret_ids = [f[0]["passage_id"] for f in fused]

            latency = (time.perf_counter() - t0) * 1000.0
            latencies_ms.append(latency)

            recalls_1.append(calculate_recall_at_k(ret_ids, gt_ids, 1))
            recalls_5.append(calculate_recall_at_k(ret_ids, gt_ids, 5))
            recalls_10.append(calculate_recall_at_k(ret_ids, gt_ids, 10))
            mrrs.append(calculate_mrr_at_k(ret_ids, gt_ids, 10))
            ndcgs.append(calculate_ndcg_at_k(ret_ids, gt_ids, 10))

        lat_perc = calculate_latency_percentiles(latencies_ms)

        benchmark_results[arch] = {
            "Recall@1": sum(recalls_1) / len(recalls_1) if recalls_1 else 0.0,
            "Recall@5": sum(recalls_5) / len(recalls_5) if recalls_5 else 0.0,
            "Recall@10": sum(recalls_10) / len(recalls_10) if recalls_10 else 0.0,
            "MRR@10": sum(mrrs) / len(mrrs) if mrrs else 0.0,
            "nDCG@10": sum(ndcgs) / len(ndcgs) if ndcgs else 0.0,
            "latency_p50_ms": lat_perc["p50"],
            "latency_p70_ms": lat_perc["p70"],
            "latency_p95_ms": lat_perc["p95"],
            "latency_p100_ms": lat_perc["p100"]
        }

    return benchmark_results

if __name__ == "__main__":
    eval_file = Path(__file__).resolve().parent.parent.parent / "data" / "evaluation" / "multilingual_eval_subsets.json"
    with open(eval_file, "r", encoding="utf-8") as f:
        records = json.load(f)
    results = run_retrieval_architecture_benchmark(records)
    print(json.dumps(results, indent=2))
