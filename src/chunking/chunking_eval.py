import time
import json
from pathlib import Path
from typing import Dict, List, Any

from src.chunking.chunkers import (
    FixedSizeChunker, SentenceChunker, ParagraphChunker,
    SemanticSimilarityChunker, ParentChildChunker
)
from src.retrieval.bm25_retriever import BM25Retriever
from src.evaluation.metrics import calculate_recall_at_k, calculate_mrr_at_k, calculate_ndcg_at_k, calculate_latency_percentiles

def run_chunking_benchmark(eval_records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates Strategies A through E across the evaluation dataset.
    Returns quantitative metric comparison.
    """
    strategies = {
        "Strategy A (Fixed Window)": FixedSizeChunker(chunk_size=300, overlap=40),
        "Strategy B (Sentence Boundary)": SentenceChunker(max_sentences_per_chunk=2),
        "Strategy C (Paragraph Boundary)": ParagraphChunker(),
        "Strategy D (Semantic Similarity)": SemanticSimilarityChunker(),
        "Strategy E (Parent-Child Multi-Res)": ParentChildChunker(parent_size=500, child_size=150, child_overlap=20)
    }

    results = {}

    for strat_name, chunker in strategies.items():
        print(f"Benchmarking {strat_name}...")
        total_chunks = 0
        latencies_ms = []
        recalls_at_1 = []
        recalls_at_5 = []
        mrrs = []
        ndcgs = []

        for record in eval_records:
            passages = record.get("passages", [])
            gt_index = record.get("ground_truth_index", 0)
            query = record.get("query", "")

            # Concatenate passages into full document
            full_doc = "\n\n".join(passages)

            # Measure Chunking Latency
            t0 = time.perf_counter()
            chunks = chunker.chunk(full_doc)
            chunk_latency = (time.perf_counter() - t0) * 1000.0
            total_chunks += len(chunks)

            # Build Corpus for retrieval
            corpus = []
            gt_chunk_ids = []
            for idx, c in enumerate(chunks):
                cid = f"chunk_{idx}"
                c_text = c.get("text") or c.get("child_text", "")
                corpus.append({"passage_id": cid, "text": c_text})
                
                # Tag ground truth if chunk contains answer snippet
                if record.get("ground_truth_passage", "")[:40] in c_text:
                    gt_chunk_ids.append(cid)

            if not gt_chunk_ids and corpus:
                gt_chunk_ids = [corpus[min(gt_index, len(corpus)-1)]["passage_id"]]

            # Index & Retrieve
            t_ret = time.perf_counter()
            retriever = BM25Retriever()
            retriever.index_corpus(corpus)
            ret_res = retriever.retrieve(query, top_k=5)
            ret_latency = (time.perf_counter() - t_ret) * 1000.0
            
            latencies_ms.append(chunk_latency + ret_latency)
            ret_ids = [r[0]["passage_id"] for r in ret_res]

            recalls_at_1.append(calculate_recall_at_k(ret_ids, gt_chunk_ids, 1))
            recalls_at_5.append(calculate_recall_at_k(ret_ids, gt_chunk_ids, 5))
            mrrs.append(calculate_mrr_at_k(ret_ids, gt_chunk_ids, 10))
            ndcgs.append(calculate_ndcg_at_k(ret_ids, gt_chunk_ids, 10))

        lat_perc = calculate_latency_percentiles(latencies_ms)

        results[strat_name] = {
            "total_chunks_produced": total_chunks,
            "avg_chunks_per_doc": total_chunks / len(eval_records) if eval_records else 0,
            "Recall@1": sum(recalls_at_1) / len(recalls_at_1) if recalls_at_1 else 0.0,
            "Recall@5": sum(recalls_at_5) / len(recalls_at_5) if recalls_at_5 else 0.0,
            "MRR@10": sum(mrrs) / len(mrrs) if mrrs else 0.0,
            "nDCG@10": sum(ndcgs) / len(ndcgs) if ndcgs else 0.0,
            "latency_p50_ms": lat_perc["p50"],
            "latency_p70_ms": lat_perc["p70"],
            "latency_p95_ms": lat_perc["p95"],
            "latency_p100_ms": lat_perc["p100"]
        }

    return results

if __name__ == "__main__":
    eval_file = Path(__file__).resolve().parent.parent.parent / "data" / "evaluation" / "multilingual_eval_subsets.json"
    with open(eval_file, "r", encoding="utf-8") as f:
        records = json.load(f)
    benchmark_res = run_chunking_benchmark(records)
    print(json.dumps(benchmark_res, indent=2))
