import sys
import os
from pathlib import Path

# Add project root to sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

import pytest
from src.config.config import settings
from src.chunking.chunkers import ParagraphChunker, SentenceChunker, FixedSizeChunker
from src.retrieval.bm25_retriever import BM25Retriever
from src.evaluation.metrics import calculate_recall_at_k, calculate_mrr_at_k
from src.guardrails.grounding_validator import GroundingValidator
from src.orchestration.pipeline import OrchestratedVoiceRAGPipeline, PipelineRequest

def test_chunking_strategies():
    text = "मैनहट्टन परियोजना द्वितीय विश्व युद्ध के दौरान एक शोध उपक्रम था।\n\nइसकी सफलता का तात्कालिक प्रभाव द्वितीय विश्व युद्ध का अंत था।"
    
    para_chunker = ParagraphChunker()
    chunks = para_chunker.chunk(text)
    assert len(chunks) == 2
    
    fixed_chunker = FixedSizeChunker(chunk_size=50, overlap=10)
    chunks_fixed = fixed_chunker.chunk(text)
    assert len(chunks_fixed) > 0

def test_bm25_retrieval():
    retriever = BM25Retriever()
    corpus = [
        {"passage_id": "p1", "text": "मैनहट्टन परियोजना की सफलता का प्रभाव द्वितीय विश्व युद्ध का अंत था।"},
        {"passage_id": "p2", "text": "भारत की राजधानी नई दिल्ली है।"}
    ]
    retriever.index_corpus(corpus)
    res = retriever.retrieve("मैनहट्टन परियोजना", top_k=1)
    assert len(res) == 1
    assert res[0][0]["passage_id"] == "p1"

def test_evaluation_metrics():
    retrieved = ["p1", "p2", "p3"]
    gt = ["p1"]
    
    r1 = calculate_recall_at_k(retrieved, gt, 1)
    mrr = calculate_mrr_at_k(retrieved, gt, 10)
    
    assert r1 == 1.0
    assert mrr == 1.0

def test_grounding_validator():
    validator = GroundingValidator()
    ctx = ["मैनहट्टन परियोजना ने पहला परमाणु हथियार बनाया।"]
    ans = "मैनहट्टन परियोजना ने पहला परमाणु हथियार बनाया।"
    
    res = validator.validate_answer_grounding(ans, ctx)
    assert res["grounded"] is True

def test_orchestrated_pipeline():
    corpus = [
        {"passage_id": "p1", "text": "मैनहट्टन परियोजना की सफलता का तात्कालिक प्रभाव द्वितीय विश्व युद्ध का अंत था।"}
    ]
    pipeline = OrchestratedVoiceRAGPipeline(corpus_passages=corpus)
    req = PipelineRequest(text_query="मैनहट्टन परियोजना का प्रभाव क्या था?", language_code="hi")
    
    resp = pipeline.process(req)
    assert resp.query == "मैनहट्टन परियोजना का प्रभाव क्या था?"
    assert resp.latency_breakdown.total_ms > 0
