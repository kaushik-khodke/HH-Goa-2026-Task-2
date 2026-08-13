import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from src.voice.stt_client import SpeechToTextClient
from src.retrieval.bm25_retriever import BM25Retriever
from src.embeddings.embedder import MultilingualEmbedder
from src.retrieval.hybrid_retriever import ReciprocalRankFusion
from src.reranking.reranker import MultilingualReranker
from src.generation.generator import GroundedAnswerGenerator
from src.guardrails.grounding_validator import GroundingValidator

class PipelineRequest(BaseModel):
    audio_bytes: Optional[bytes] = None
    text_query: Optional[str] = None
    language_code: str = "hi"
    top_k_retrieval: int = 10
    top_k_rerank: int = 3

class StageLatency(BaseModel):
    stt_ms: float = 0.0
    query_proc_ms: float = 0.0
    sparse_retrieval_ms: float = 0.0
    dense_retrieval_ms: float = 0.0
    fusion_ms: float = 0.0
    rerank_ms: float = 0.0
    generation_ms: float = 0.0
    guardrail_ms: float = 0.0
    total_ms: float = 0.0

class PipelineResponse(BaseModel):
    query: str
    language: str
    transcription_confidence: float = 1.0
    answer: str
    retrieved_contexts: List[str]
    is_grounded: bool
    grounding_score: float
    abstained: bool = False
    latency_breakdown: StageLatency

class OrchestratedVoiceRAGPipeline:
    """Production-grade Orchestrated Voice-Enabled Multilingual RAG Pipeline."""
    def __init__(self, corpus_passages: Optional[List[Dict[str, Any]]] = None):
        self.stt_client = SpeechToTextClient(provider="standard")
        self.embedder = MultilingualEmbedder()
        self.bm25_engine = BM25Retriever()
        self.rrf = ReciprocalRankFusion(k=60)
        self.reranker = MultilingualReranker()
        self.generator = GroundedAnswerGenerator()
        self.validator = GroundingValidator()
        
        self.corpus_passages = corpus_passages or []
        if self.corpus_passages:
            self.bm25_engine.index_corpus(self.corpus_passages)

    def set_corpus(self, corpus_passages: List[Dict[str, Any]]):
        """Update or index dynamic passage corpus."""
        self.corpus_passages = corpus_passages
        self.bm25_engine.index_corpus(corpus_passages)

    def process(self, request: PipelineRequest) -> PipelineResponse:
        total_start = time.perf_counter()
        latencies = StageLatency()
        
        # Stage 1: Speech-to-Text (if audio provided)
        stt_start = time.perf_counter()
        if request.audio_bytes:
            stt_res = self.stt_client.transcribe_audio_bytes(request.audio_bytes, request.language_code)
            query_text = stt_res["transcription"]
            stt_confidence = stt_res["confidence"]
        else:
            query_text = request.text_query or ""
            stt_confidence = 1.0
        latencies.stt_ms = (time.perf_counter() - stt_start) * 1000.0

        # Stage 2: Query Normalization & Input Guardrail
        qproc_start = time.perf_counter()
        query_text = query_text.strip()
        latencies.query_proc_ms = (time.perf_counter() - qproc_start) * 1000.0
        
        if not query_text:
            latencies.total_ms = (time.perf_counter() - total_start) * 1000.0
            return PipelineResponse(
                query="",
                language=request.language_code,
                transcription_confidence=0.0,
                answer="Received empty query.",
                retrieved_contexts=[],
                is_grounded=False,
                grounding_score=0.0,
                abstained=True,
                latency_breakdown=latencies
            )

        # Stage 3: Sparse Retrieval (BM25)
        bm25_start = time.perf_counter()
        sparse_results = []
        if self.corpus_passages:
            sparse_results = self.bm25_engine.retrieve(query_text, top_k=request.top_k_retrieval)
        latencies.sparse_retrieval_ms = (time.perf_counter() - bm25_start) * 1000.0

        # Stage 4: Dense Retrieval (BGE-M3)
        dense_start = time.perf_counter()
        dense_results = []
        if self.corpus_passages:
            doc_texts = [p["text"] for p in self.corpus_passages]
            doc_embs = self.embedder.encode(doc_texts)
            q_emb = self.embedder.encode(query_text)
            scores = self.embedder.compute_similarity(q_emb, doc_embs)
            top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:request.top_k_retrieval]
            dense_results = [(self.corpus_passages[idx], float(scores[idx])) for idx in top_indices]
        latencies.dense_retrieval_ms = (time.perf_counter() - dense_start) * 1000.0

        # Stage 5: Hybrid Fusion (RRF)
        fusion_start = time.perf_counter()
        fused_candidates = self.rrf.fuse(sparse_results, dense_results, top_k=request.top_k_retrieval)
        latencies.fusion_ms = (time.perf_counter() - fusion_start) * 1000.0

        # Stage 6: Reranking
        rerank_start = time.perf_counter()
        candidate_dicts = [f[0] for f in fused_candidates]
        reranked_passages = self.reranker.rerank(query_text, candidate_dicts, top_k=request.top_k_rerank)
        latencies.rerank_ms = (time.perf_counter() - rerank_start) * 1000.0

        # Stage 7: Retrieval Confidence & Relevance Guardrail Check
        g_start = time.perf_counter()
        has_confidence, reason = self.validator.validate_retrieval_confidence(query_text, reranked_passages)
        latencies.guardrail_ms = (time.perf_counter() - g_start) * 1000.0

        contexts = [p[0].get("raw_text", p[0]["text"]) for p in reranked_passages] if has_confidence else []

        # Stage 8: Grounded Generation (Direct Gemini generation when dataset context is absent)
        gen_start = time.perf_counter()
        gen_output = self.generator.generate_grounded_answer(query_text, contexts, request.language_code)
        latencies.generation_ms = (time.perf_counter() - gen_start) * 1000.0

        # Stage 9: Grounding Validation Guardrail
        g_start = time.perf_counter()
        g_res = self.validator.validate_answer_grounding(gen_output["answer"], contexts) if contexts else {"grounded": False, "grounding_score": 0.0}
        latencies.guardrail_ms += (time.perf_counter() - g_start) * 1000.0

        latencies.total_ms = (time.perf_counter() - total_start) * 1000.0

        return PipelineResponse(
            query=query_text,
            language=request.language_code,
            transcription_confidence=stt_confidence,
            answer=gen_output["answer"],
            retrieved_contexts=contexts,
            is_grounded=g_res["grounded"] if contexts else False,
            grounding_score=g_res["grounding_score"] if contexts else 0.0,
            abstained=gen_output["abstained"],
            latency_breakdown=latencies
        )
