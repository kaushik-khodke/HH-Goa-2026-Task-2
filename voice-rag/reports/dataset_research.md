# Dataset Research & Forensics Report: `ai4bharat/MSMARCO-XI`

**Project**: HH Goa 2026 — Voice-Enabled Multilingual RAG System (Task 2)  
**Date**: August 2026  
**Primary Dataset**: [`ai4bharat/MSMARCO-XI`](https://huggingface.co/datasets/ai4bharat/MSMARCO-XI)  
**Publication Reference**: *IndicRAGSuite: LargeScale Datasets and a Benchmark for Indian Language RAG Systems* (arXiv:2506.01615)

---

## 1. Executive Summary

This report presents technical forensics and architectural evaluation of the `ai4bharat/MSMARCO-XI` dataset. The dataset contains the MS MARCO passage ranking and reading comprehension benchmark translated into 14 Indic languages, along with original English content and detailed translation metadata.

---

## 2. Dataset Overview & Specifications

| Metric / Attribute | Value |
| :--- | :--- |
| **Hugging Face ID** | `ai4bharat/MSMARCO-XI` |
| **Format** | Parquet / JSONL |
| **Total Storage Size** | 55.6 GB (across all language splits) |
| **Supported Languages** | 14 Indic languages + English source pair |
| **Primary Task Focus** | Passage Retrieval, Cross-lingual QA, Grounded Multilingual RAG |

### Supported Indic Languages
1. **Assamese (`as`)** — Target lang tag: `asm_Beng`
2. **Bengali (`bn`)** — Target lang tag: `ben_Beng`
3. **Gujarati (`gu`)** — Target lang tag: `guj_Gujr`
4. **Hindi (`hi`)** — Target lang tag: `hin_Deva`
5. **Kannada (`kn`)** — Target lang tag: `kan_Knda`
6. **Malayalam (`ml`)** — Target lang tag: `mal_Mlym`
7. **Marathi (`mr`)** — Target lang tag: `mar_Deva`
8. **Nepali (`ne`)** — Target lang tag: `nep_Deva`
9. **Odia (`or`)** — Target lang tag: `ori_Orya`
10. **Punjabi (`pa`)** — Target lang tag: `pan_Guru`
11. **Sanskrit (`sa`)** — Target lang tag: `san_Deva`
12. **Tamil (`ta`)** — Target lang tag: `tam_Taml`
13. **Telugu (`te`)** — Target lang tag: `tel_Telu`
14. **Urdu (`ur`)** — Target lang tag: `urd_Arab`

---

## 3. Data Schema & Field Definitions

Each record in `ai4bharat/MSMARCO-XI` conforms to the following schema:

```json
{
    "source_lang": "eng_Latn",
    "target_lang": "hin_Deva",
    "meta": {
        "model_name": "ckpt-3epochs-sft-then-400k-kd",
        "temperature": 0.0,
        "max_tokens": 4096,
        "top_p": 1.0,
        "frequency_penalty": 0.0,
        "presence_penalty": 0.0
    },
    "query": "मैनहट्टन परियोजना की सफलता का तत्काल प्रभाव क्या था?",
    "Answer": "मैनहट्टन परियोजना की सफलता का तत्काल प्रभाव यह था...",
    "query_id": 1185869,
    "query_type": "DESCRIPTION",
    "passages": {
        "is_selected": [1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        "English_passages": ["The presence of communication amid scientific minds...", "..."],
        "Translated_passages": ["वैज्ञानिक दिमागों के बीच संचार की उपस्थिति...", "..."]
    },
    "Eng_Query": "what was the immediate impact of the success of the manhattan project?",
    "Eng_Answer": "The immediate impact of the success of the manhattan project was..."
}
```

### Field Breakdown
- `query_id` (int): Unique MS MARCO query identifier.
- `query_type` (str): Categorical query intent (`DESCRIPTION`, `NUMERIC`, `LOCATION`, `PERSON`, `ENTITY`).
- `query` (str): Translated query text in target Indic language.
- `Eng_Query` (str): Original English query text.
- `Answer` (str): Reference ground truth answer translated into Indic language.
- `Eng_Answer` (str): Reference ground truth answer in English.
- `passages` (dict):
  - `is_selected` (list[int]): Binary indicator array (length 10). `1` indicates passage contains the correct answer; `0` indicates non-relevant candidate.
  - `English_passages` (list[str]): List of candidate passages in English.
  - `Translated_passages` (list[str]): Synchronized translated candidate passages in target Indic language.

---

## 4. Data Forensics & Quality Assessment

1. **Relevance Labels**:
   - `passages['is_selected']` provides explicit binary ground truth for retrieval evaluation (Recall@K, MRR@10, nDCG@10).
   - Typically 1 out of 10 passages is marked selected (`is_selected == 1`), creating a realistic ranking scenario.

2. **Passage & Query Length Distributions**:
   - **Query Length**: ~6–10 words (short-to-medium length queries), matching real-world spoken voice input.
   - **Passage Length**: ~50–70 words (~300–450 characters) per passage.

3. **Data Quality & Edge Cases**:
   - **Missing Answers**: A small fraction of queries in MS MARCO have empty/blank answers ("No answer present"). These serve as test cases for **Abstention Guardrails** (testing whether the model correctly abstains when evidence is absent).
   - **Translation Fidelity**: AI4Bharat used distillation models (`ckpt-3epochs-sft-then-400k-kd`) with `temperature: 0.0` to preserve factual entity alignment.

---

## 5. Evaluation Split Strategy (Zero Data-Leakage)

To maintain evaluation integrity:
1. **Validation Split**: We sample 1,000 queries per target language from the official `validation` split.
2. **Corpus Build**: All candidate passages across the validation queries are indexed into BM25 and FAISS vector stores.
3. **No Leakage**: Training data splits are completely isolated from retrieval benchmarks.

---

## 6. Architectural Implications & Next Steps

1. **Voice STT Selection**: Sarvam AI provides native Indic ASR support across Indic scripts, making it the primary candidate for spoken query transcription.
2. **Multi-Strategy Chunking (Phase 3)**: Although passages in MSMARCO-XI are pre-split, we will evaluate 5 distinct chunking strategies (Fixed, Sentence, Paragraph, Semantic Similarity, Parent-Child) on concatenated passages to evaluate chunking trade-offs.
3. **Hybrid Retrieval (Phase 5 & 6)**: Dense embedding (BGE-M3) combined with BM25 via Reciprocal Rank Fusion (RRF).

---

## 7. Recommended Next Steps & Approvals

- **Phase 2**: Construct standard multilingual evaluation datasets (`data/evaluation/multilingual_eval_subsets.json`).
- **Phase 3**: Run chunking strategy experiments in `notebooks/03_chunking_experiments.ipynb`.
