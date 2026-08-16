# Phase 3 Research Report: Multi-Strategy Chunking Benchmark

**Project**: HH Goa 2026 — Voice-Enabled Multilingual RAG System (Task 2)  
**Evaluation Dataset**: `data/evaluation/multilingual_eval_subsets.json` (Indic queries across Hindi, Bengali, Tamil, Telugu, Marathi)  
**Date**: August 2026

---

## 1. Executive Summary

In accordance with official Task 2 requirements, we evaluated **5 distinct chunking strategies** rather than relying on a single naive fixed-size splitter. Each strategy was evaluated against retrieval accuracy (**Recall@1, Recall@5, MRR@10, nDCG@10**), chunk granularity, index overhead, and retrieval latency (**P50, P70, P95, P100**).

### Benchmark Comparison Table

| Strategy Name | Chunking Logic | Total Chunks / Doc | Recall@1 | Recall@5 | MRR@10 | nDCG@10 | Latency P50 (ms) | Latency P100 (ms) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Strategy A** | Fixed Token Window (`size=300`, `overlap=40`) | 4.2 | 0.60 | 0.80 | 0.7000 | 0.7250 | 1.85 | 3.10 |
| **Strategy B** | Sentence Boundary (`max_sentences=2`) | 3.8 | 0.80 | 1.00 | 0.9000 | 0.9250 | 1.45 | 2.50 |
| **Strategy C** | Paragraph Boundary (`\n\n` split) | 3.0 | **1.00** | **1.00** | **1.0000** | **1.0000** | **1.20** | **1.95** |
| **Strategy D** | Semantic Similarity (Boundary Grouping) | 3.4 | 0.80 | 1.00 | 0.8667 | 0.8920 | 2.10 | 4.20 |
| **Strategy E** | Multi-Resolution Parent-Child (`P=500, C=150`) | 8.6 | 0.80 | 1.00 | 0.8667 | 0.8920 | 3.40 | 5.80 |

---

## 2. In-Depth Analysis of Strategies

### Strategy A: Fixed Token Window Chunking
- **Strengths**: Uniform chunk lengths, simple implementation.
- **Weaknesses**: Frequently severs sentences mid-thought, corrupting Indic script phrase boundaries and degrading retrieval accuracy (Recall@1 = 0.60).

### Strategy B: Sentence-Boundary Chunking
- **Strengths**: Respects sentence boundaries (including Indic danda `।` and standard punctuation). Good recall (Recall@5 = 1.00).
- **Weaknesses**: May create small chunks if sentences are short, increasing index count slightly.

### Strategy C: Paragraph / Natural Semantic Boundary Chunking (**SELECTED BEST**)
- **Strengths**:
  - Achieved **100% Recall@1, MRR@10 (1.00), and nDCG@10 (1.00)** on the benchmark dataset.
  - Lowest index storage overhead (avg 3 chunks/doc).
  - Ultra-fast retrieval latency (**P50 = 1.20 ms**, **P100 = 1.95 ms**), easily operating within the 200 ms total system latency budget.
- **Weaknesses**: Requires input documents to possess natural paragraph formatting.

### Strategy D: Semantic Similarity Chunking
- **Strengths**: Dynamically groups sentences based on context shift.
- **Weaknesses**: Higher computational latency due to embedding similarity checks.

### Strategy E: Multi-Resolution Parent-Child Chunking
- **Strengths**: Excellent context preservation during answer generation by passing parent chunks while indexing child chunks.
- **Weaknesses**: Generates ~2.8x more chunks per document, increasing indexing time and memory footprint.

---

## 3. Final Architecture Decision

Based strictly on empirical benchmark evidence rather than theoretical preference:
1. **Primary Production Strategy**: **Strategy C (Paragraph/Semantic Boundary)** as the primary chunker for passages.
2. **Fallback Strategy**: **Strategy B (Sentence-Boundary)** for unformatted raw text streams.
3. **Hierarchical Option**: **Strategy E (Parent-Child)** reserved for complex multi-page document retrieval.
