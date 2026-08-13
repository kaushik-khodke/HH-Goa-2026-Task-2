# Voice-Enabled Multilingual RAG System — HH Goa 2026 (Task 2)

A competition-grade, low-latency, grounded Voice RAG system built on the `ai4bharat/MSMARCO-XI` dataset.

## System Overview
- **Voice Input / STT**: Sarvam AI / ElevenLabs API (supporting 14 Indic languages)
- **Dataset**: `ai4bharat/MSMARCO-XI` (14 Indic languages + English pair)
- **Retrieval Engine**: Multi-strategy Chunking + BM25 Sparse + BAAI BGE-M3 Dense + Reciprocal Rank Fusion (RRF) + Multilingual Reranker
- **Answer Generation**: Grounded Multilingual LLM (Gemini / Qwen / Sarvam) with strict context constraint & abstention guardrails
- **Target Latency**: P50/P70/P95/P100 latency engineering under 200 ms for core RAG pipeline.

## Repository Structure
```text
voice-rag/
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
├── data/
│   ├── raw/
│   ├── processed/
│   └── evaluation/
├── models/
├── indexes/
│   ├── faiss/
│   └── bm25/
├── notebooks/
│   ├── 00_environment_check.ipynb
│   ├── 01_dataset_research.ipynb
│   ├── 02_dataset_analysis.ipynb
│   ├── 03_chunking_experiments.ipynb
│   ├── 04_embedding_benchmark.ipynb
│   ├── 05_sparse_retrieval.ipynb
│   ├── 06_hybrid_retrieval.ipynb
│   ├── 07_reranker_benchmark.ipynb
│   ├── 08_generation_model_benchmark.ipynb
│   ├── 09_rag_evaluation.ipynb
│   ├── 10_guardrail_evaluation.ipynb
│   └── 11_latency_benchmark.ipynb
├── reports/
│   └── dataset_research.md
├── src/
│   ├── config/
│   ├── data/
│   ├── preprocessing/
│   ├── chunking/
│   ├── embeddings/
│   ├── retrieval/
│   ├── reranking/
│   ├── generation/
│   ├── voice/
│   ├── guardrails/
│   ├── orchestration/
│   └── evaluation/
├── backend/
│   ├── api/
│   └── services/
├── frontend/
├── tests/
└── scripts/
```

## Setup & Running
1. Copy `.env.example` to `.env` and fill in credentials.
2. Install dependencies: `pip install -r requirements.txt`.
