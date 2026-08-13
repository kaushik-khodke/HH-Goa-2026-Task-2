
# HH Goa 2026 — Voice-Enabled RAG System

## Master Development Prompt for Antigravity

You are the lead AI/ML engineer responsible for building a competition-grade **Voice-Enabled Multilingual Retrieval-Augmented Generation (RAG) system** for **HH Goa 2026 Task 2**.

Do NOT immediately start writing the final application.

We want to build this as a serious research + engineering project where **accuracy, retrieval quality, grounding, robustness, and latency are measured experimentally** before final architecture decisions are made.

The official task requirements are:

1. User speaks a question.
2. Speech is converted to text.
3. Relevant context is retrieved from the provided dataset.
4. The system generates a grounded answer.
5. Dataset: `ai4bharat/MSMARCO-XI`
6. Speech-to-text must use either Sarvam or ElevenLabs.
7. Chunking must demonstrate multiple thoughtful strategies rather than one naive fixed-size splitter.
8. Full pipeline has a target latency of under 200 ms.
9. Report P50, P70 and P100 latency.
10. Use a proper orchestration/harness with structured execution, retries, error handling and structured input/output.
11. Add guardrails for off-topic queries, unsafe inputs, hallucinations and answers not supported by retrieved context.

The final system must be production-quality enough for a hackathon demo and technically defensible during evaluation.

---

# 1. DEVELOPMENT ENVIRONMENT

Use:

* Antigravity as the main development environment
* Python
* Local Jupyter Notebook for research and experimentation
* Git/GitHub for version control
* Virtual environment / isolated Python environment
* GPU acceleration when available
* CPU fallback where practical

Do NOT make the entire project one giant notebook.

Use notebooks for experimentation and modular Python files for the actual application.

---

# 2. PROJECT STRUCTURE

Create and maintain a clean industry-style structure:

```text
voice-rag/
│
├── README.md
├── requirements.txt
├── .env.example
├── .gitignore
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── evaluation/
│
├── models/
│
├── indexes/
│   ├── faiss/
│   └── bm25/
│
├── notebooks/
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
│
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
│
├── backend/
│   ├── api/
│   └── services/
│
├── frontend/
│
├── tests/
│
└── scripts/
```

Keep responsibilities separated.

Do not create duplicate implementations of the same functionality.

---

# 3. PHASE 0 — MACHINE AND ENVIRONMENT AUDIT

Before implementing the ML pipeline, inspect the local machine.

Determine:

* OS
* CPU
* RAM
* GPU
* GPU VRAM
* CUDA availability
* Python version
* available disk space
* whether local inference is practical
* whether Ollama/local LLMs are practical
* whether API-based models should be used

Create:

```text
notebooks/00_environment_check.ipynb
```

and save the results.

Do NOT assume the machine has a GPU.

Adapt the architecture according to actual hardware.

---

# 4. PHASE 1 — DATASET RESEARCH

Before building retrieval, thoroughly inspect:

`ai4bharat/MSMARCO-XI`

Use the official Hugging Face dataset as the primary source.

Determine:

* dataset structure
* files/configurations
* columns
* languages
* query structure
* passage structure
* answer fields
* translation fields
* metadata
* IDs
* duplicate records
* missing values
* corrupted records
* language distribution
* query length distribution
* passage length distribution
* train/validation/test availability
* relevance labels
* whether evaluation can be performed without leakage

Create:

```text
notebooks/01_dataset_research.ipynb
notebooks/02_dataset_analysis.ipynb
```

Do not invent dataset columns.

Inspect the actual dataset before writing preprocessing code.

Produce a concise research report:

```text
reports/
└── dataset_research.md
```

---

# 5. PHASE 2 — BUILD A RETRIEVAL EVALUATION DATASET

We need a reliable evaluation methodology before comparing models.

Construct an evaluation subset from the dataset.

Preserve:

* query
* relevant passage
* language
* query ID
* passage ID
* relevance information

Prevent train/evaluation leakage.

Support evaluation per language as well as overall.

Create evaluation metrics for:

* Recall@1
* Recall@5
* Recall@10
* MRR@10
* nDCG@10
* Precision@K where applicable

Also report:

* average latency
* P50
* P70
* P95
* P100

Never report only one best-case latency.

---

# 6. PHASE 3 — CHUNKING RESEARCH

The task specifically requires thoughtful chunking.

Do NOT use only:

```text
chunk_size=500
overlap=50
```

Implement and benchmark multiple strategies.

At minimum:

### Strategy A

Fixed token/character chunking.

### Strategy B

Sentence-based chunking.

### Strategy C

Paragraph/semantic-boundary chunking.

### Strategy D

Semantic chunking using embedding similarity.

### Strategy E

Multi-resolution / parent-child chunking.

For each strategy evaluate:

* retrieval recall
* MRR
* nDCG
* answer quality
* number of chunks
* index size
* retrieval latency

Create:

```text
notebooks/03_chunking_experiments.ipynb
```

Do not choose a strategy because it is theoretically popular.

Choose it based on benchmark results.

---

# 7. PHASE 4 — EMBEDDING MODEL RESEARCH

Do NOT assume a model is best.

Benchmark multiple multilingual embedding models.

Initial candidates:

* BAAI BGE-M3
* multilingual-e5-large-instruct
* Jina multilingual embeddings
* other strong multilingual/Indic embedding models that are compatible with the local hardware

Research additional relevant Indic retrieval models if appropriate.

For every model measure:

* Recall@1
* Recall@5
* Recall@10
* MRR@10
* nDCG@10
* embedding generation speed
* memory usage
* index size
* retrieval latency
* per-language performance

Create:

```text
notebooks/04_embedding_benchmark.ipynb
```

Output a comparison table.

Select the best model based on actual experimental evidence.

Do not simply select the model with the largest parameter count.

---

# 8. PHASE 5 — SPARSE RETRIEVAL

Implement BM25.

Benchmark it independently.

Measure:

* Recall@K
* MRR
* nDCG
* latency

Create:

```text
notebooks/05_sparse_retrieval.ipynb
```

---

# 9. PHASE 6 — HYBRID RETRIEVAL

Implement:

```text
Dense Retrieval
        +
BM25
        ↓
Rank Fusion
        ↓
Top-K candidates
```

Use Reciprocal Rank Fusion or another justified fusion strategy.

Benchmark:

1. Dense only
2. BM25 only
3. Hybrid

Determine whether hybrid retrieval actually improves retrieval quality.

Do not add components merely for complexity.

Create:

```text
notebooks/06_hybrid_retrieval.ipynb
```

---

# 10. PHASE 7 — RERANKER RESEARCH

Benchmark multilingual rerankers.

Initial candidates:

* BGE Reranker v2 M3
* Jina multilingual reranker
* other suitable multilingual rerankers

Pipeline:

```text
Top 20–50 retrieval candidates
          ↓
       Reranker
          ↓
       Top 3–5
```

Measure:

* Recall
* MRR
* nDCG
* answer correctness
* latency

Create:

```text
notebooks/07_reranker_benchmark.ipynb
```

Select the best accuracy/latency tradeoff.

---

# 11. PHASE 8 — GENERATION MODEL RESEARCH

Do NOT immediately choose a huge LLM.

Benchmark suitable generation models based on:

* answer correctness
* faithfulness
* multilingual quality
* instruction following
* latency
* hardware requirements
* API cost if applicable

Possible categories:

* Gemini
* Qwen
* Gemma
* Sarvam
* other strong multilingual instruction models

The generation model must be instructed to answer ONLY from retrieved evidence.

If evidence is insufficient, it must abstain.

Create:

```text
notebooks/08_generation_model_benchmark.ipynb
```

---

# 12. PHASE 9 — FINAL RAG ARCHITECTURE

After all experiments, construct the final architecture.

Target architecture:

```text
                    VOICE INPUT
                        │
                        ↓
                Speech-to-Text
                        │
                        ↓
                Query Processing
                        │
              ┌─────────┴─────────┐
              │                   │
              ↓                   ↓
          BM25 Search       Dense Retrieval
              │                   │
              └─────────┬─────────┘
                        ↓
                 Rank Fusion
                        ↓
                  Top Candidates
                        ↓
                    Reranker
                        ↓
                  Top Contexts
                        ↓
                Context Builder
                        ↓
                Answer Generator
                        ↓
              Grounding Validator
                        ↓
                Guardrail Layer
                        ↓
                    RESPONSE
```

The actual architecture may differ if benchmarks show a better design.

---

# 13. PHASE 10 — VOICE PIPELINE

Use ONE of the required providers:

* Sarvam
* ElevenLabs

Research current API capabilities before implementation.

Prefer Sarvam if its Indic-language capabilities provide better results for this dataset/use case.

Implement the voice module independently:

```text
src/voice/
├── stt_client.py
├── language_detection.py
└── audio_processing.py
```

Support:

* voice input
* language detection
* transcription
* error handling
* API timeout
* retry handling

Design the system so STT can later support streaming where practical.

---

# 14. PHASE 11 — GUARDRAILS

Implement multiple layers.

### Input guardrail

Detect:

* empty input
* malformed input
* unsupported language
* unsafe input
* irrelevant queries

### Retrieval guardrail

If retrieval confidence is too low:

```text
Do not generate a fabricated answer.
```

### Generation guardrail

The model must answer using retrieved evidence only.

### Grounding validator

Check whether the answer is supported by the retrieved context.

### Abstention

If evidence is insufficient:

```text
I don't have enough information in the provided knowledge base to answer that reliably.
```

Do not hallucinate.

Create:

```text
notebooks/10_guardrail_evaluation.ipynb
```

Measure:

* hallucination rate
* unsupported-answer rate
* correct abstention rate
* false refusal rate

---

# 15. PHASE 12 — ORCHESTRATION HARNESS

The task explicitly requires a proper harness.

Do NOT implement everything as:

```python
answer = llm(prompt)
```

Create an orchestrated pipeline.

Example:

```text
Request
  ↓
Input validation
  ↓
STT
  ↓
Query normalization
  ↓
Retrieval
  ↓
Reranking
  ↓
Context validation
  ↓
Generation
  ↓
Grounding validation
  ↓
Response formatting
```

Every stage must have:

* structured input
* structured output
* timeout
* error handling
* logging
* retry where appropriate
* latency measurement

Use typed Python models where appropriate.

---

# 16. PHASE 13 — LATENCY ENGINEERING

The official target is under 200 ms.

Treat latency as a first-class engineering requirement.

Measure separately:

```text
STT latency
Query processing latency
Embedding latency
BM25 latency
FAISS latency
Fusion latency
Reranking latency
Generation latency
Guardrail latency
Total latency
```

Then calculate:

* P50
* P70
* P95
* P100

Run a meaningful number of test queries.

Do NOT fake or manually enter latency numbers.

Create:

```text
notebooks/11_latency_benchmark.ipynb
```

Optimize using:

* model preloading
* persistent indexes
* batching where useful
* caching
* reduced embedding dimensions if supported
* efficient vector search
* top-K optimization
* asynchronous operations where useful
* avoiding unnecessary model calls
* local inference where hardware permits

If the complete voice-to-answer pipeline cannot realistically achieve <200 ms on the development hardware, clearly separate:

1. retrieval latency
2. RAG processing latency
3. end-to-end voice latency

and document the limitation honestly.

Never fabricate benchmark results.

---

# 17. PHASE 14 — FINAL EVALUATION

Create a complete evaluation framework.

### Retrieval

* Recall@1
* Recall@5
* Recall@10
* MRR@10
* nDCG@10

### Generation

* correctness
* relevance
* faithfulness
* groundedness
* hallucination rate

### Voice

* WER where ground truth is available
* transcription quality
* language handling
* code-mixed handling

### System

* P50
* P70
* P95
* P100
* throughput
* memory usage

### Robustness

Test:

* normal queries
* short queries
* long queries
* multilingual queries
* code-mixed queries
* spelling mistakes
* ambiguous queries
* irrelevant queries
* adversarial/off-topic queries
* queries with no supporting evidence

Generate a final report:

```text
reports/
└── final_evaluation.md
```

---

# 18. IMPORTANT RESEARCH RULE

Do not optimize for complexity.

Every architectural component must justify itself with measurable improvement.

For example:

If:

```text
BGE-M3 + BM25 + reranker
```

has better accuracy but violates the latency target,

test:

```text
BGE-M3 + BM25
```

or another optimized configuration.

The final architecture should maximize:

```text
Accuracy
+
Groundedness
+
Multilingual performance
+
Robustness
+
Latency
```

rather than maximizing the number of models.

---

# 19. FINAL APPLICATION

Once research is complete, build the actual application.

Backend:

* FastAPI
* modular services
* async where appropriate
* structured API responses
* logging
* error handling

Frontend:

Create a professional voice-first interface.

The interface should include:

* microphone button
* recording state
* detected language
* transcribed question
* retrieved context indicator
* generated answer
* confidence/grounding indicator
* response latency
* error state
* source/context display where appropriate

Do not hardcode answers.

Everything must come from the actual pipeline.

---

# 20. CONFIGURATION

Never hardcode API keys.

Use:

```text
.env
```

with:

```text
SARVAM_API_KEY=
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
```

Only include the keys actually required by the selected architecture.

Provide:

```text
.env.example
```

Never commit `.env`.

---

# 21. TESTING

Create unit and integration tests.

At minimum test:

* dataset loading
* chunking
* embedding
* retrieval
* reranking
* generation
* guardrails
* API
* voice errors
* low-confidence retrieval
* unsupported questions

Run tests before considering the project complete.

---

# 22. GIT DISCIPLINE

Use meaningful commits:

```text
feat: add dataset analysis
feat: implement chunking strategies
feat: benchmark embeddings
feat: add BM25 retrieval
feat: implement hybrid retrieval
feat: add multilingual reranker
feat: add generation pipeline
feat: add voice input
feat: add grounding guardrails
feat: add latency benchmarking
feat: add frontend
```

Do not make one giant final commit.

---

# 23. DOCUMENTATION

README must contain:

1. Problem statement
2. Solution
3. Architecture
4. Dataset
5. Chunking strategies
6. Embedding benchmark
7. Retrieval architecture
8. Reranker
9. Generation model
10. Voice pipeline
11. Guardrails
12. Evaluation methodology
13. Latency results
14. Installation
15. Configuration
16. Running locally
17. API documentation
18. Screenshots
19. Limitations
20. Future improvements

Include actual benchmark numbers.

Never fabricate results.

---

# 24. CRITICAL ANTIGRAVITY BEHAVIOR

Follow these rules throughout development:

### Rule 1

Do not blindly follow the initial model choices.

Research and benchmark them.

### Rule 2

Do not overwrite working code without inspecting it first.

### Rule 3

Before adding a dependency, check whether an existing dependency can perform the task.

### Rule 4

Do not duplicate functionality.

### Rule 5

Do not hardcode dataset assumptions.

Inspect the dataset first.

### Rule 6

Do not hardcode answers or demo outputs.

### Rule 7

Do not fabricate accuracy, latency or evaluation numbers.

### Rule 8

Every important model decision must be backed by an experiment.

### Rule 9

Keep research notebooks separate from production code.

### Rule 10

Optimize for actual competition requirements rather than making the project unnecessarily complicated.

---

# 25. FIRST ACTION — DO NOT BUILD THE FINAL SYSTEM YET

Your FIRST task is only:

### Step 1

Inspect the local machine.

### Step 2

Create the project structure.

### Step 3

Set up the Python environment.

### Step 4

Download/inspect `ai4bharat/MSMARCO-XI`.

### Step 5

Create:

```text
notebooks/01_dataset_research.ipynb
```

### Step 6

Perform dataset forensics.

### Step 7

Create:

```text
reports/dataset_research.md
```

### Step 8

STOP.

Do not implement the final RAG pipeline until the dataset research has been reviewed.

After completing Phase 1, clearly report:

* what was discovered
* dataset size
* available languages
* important fields
* data quality issues
* retrieval/evaluation possibilities
* recommended next experiment
* any assumptions that still need validation

Then wait for approval before proceeding to the next phase.

The objective is to build the **highest-quality, empirically validated Voice RAG system possible**, not simply to produce a working demo.
