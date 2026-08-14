import re
import math
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional

from src.config.config import BM25_INDEX_DIR

try:
    from rank_bm25 import BM25Okapi
except ImportError:
    class BM25Okapi:
        def __init__(self, corpus: List[List[str]], k1: float = 1.5, b: float = 0.75):
            self.k1 = k1
            self.b = b
            self.corpus_size = len(corpus)
            self.avgdl = sum(len(doc) for doc in corpus) / self.corpus_size if self.corpus_size > 0 else 1.0
            self.doc_freqs = []
            self.idf = {}
            self.doc_len = []
            
            df = {}
            for doc in corpus:
                self.doc_len.append(len(doc))
                freqs = {}
                for word in doc:
                    freqs[word] = freqs.get(word, 0) + 1
                self.doc_freqs.append(freqs)
                for word in freqs:
                    df[word] = df.get(word, 0) + 1

            for word, freq in df.items():
                self.idf[word] = math.log((self.corpus_size - freq + 0.5) / (freq + 0.5) + 1)

        def get_scores(self, query: List[str]) -> List[float]:
            scores = [0.0] * self.corpus_size
            for q_term in query:
                q_idf = self.idf.get(q_term, 0.0)
                if q_idf == 0.0:
                    continue
                for idx, doc_freq in enumerate(self.doc_freqs):
                    tf = doc_freq.get(q_term, 0)
                    if tf > 0:
                        doc_l = self.doc_len[idx]
                        denom = tf + self.k1 * (1.0 - self.b + self.b * (doc_l / self.avgdl))
                        scores[idx] += q_idf * ((tf * (self.k1 + 1.0)) / denom)
            return scores


class BM25Retriever:
    """Sparse retrieval engine using BM25 with Indic tokenization and local disk persistence."""
    def __init__(self, k1: float = 1.5, b: float = 0.75, index_dir: Optional[Path] = None):
        self.k1 = k1
        self.b = b
        self.bm25 = None
        self.corpus_passages: List[Dict[str, Any]] = []
        self.index_dir = Path(index_dir) if index_dir else BM25_INDEX_DIR
        self.index_dir.mkdir(parents=True, exist_ok=True)
        self.index_file = self.index_dir / "bm25_index.json"

    def _tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r'[^\w\s]', ' ', text.lower())
        tokens = [t.strip() for t in cleaned.split() if t.strip()]
        return tokens

    def index_corpus(self, corpus_passages: List[Dict[str, Any]]):
        """Index corpus passage objects and save bm25_index.json to disk."""
        self.corpus_passages = corpus_passages
        tokenized_corpus = [self._tokenize(p.get("text", "")) for p in corpus_passages]
        self.bm25 = BM25Okapi(tokenized_corpus, k1=self.k1, b=self.b)

        # Save to disk in indexes/bm25/bm25_index.json
        try:
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump({
                    "k1": self.k1,
                    "b": self.b,
                    "corpus_size": len(corpus_passages),
                    "passages": corpus_passages,
                }, f, ensure_ascii=False, indent=2)
            print(f"=== BM25 Index Saved Locally: {len(corpus_passages)} docs -> {self.index_file} ===")
        except Exception as e:
            print(f"Notice: Could not write bm25_index.json: {e}")

    def load_index(self) -> bool:
        """Load index from indexes/bm25/bm25_index.json."""
        if self.index_file.exists():
            try:
                with open(self.index_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self.index_corpus(data.get("passages", []))
                return True
            except Exception as e:
                print(f"Notice: Failed to load local BM25 index: {e}")
        return False

    def retrieve(self, query: str, top_k: int = 10) -> List[Tuple[Dict[str, Any], float]]:
        if not self.bm25:
            if not self.load_index():
                return []

        tokens = self._tokenize(query)
        if not tokens:
            return [(p, 0.0) for p in self.corpus_passages[:top_k]]

        scores = self.bm25.get_scores(tokens)
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]

        results = []
        for idx in top_indices:
            results.append((self.corpus_passages[idx], float(scores[idx])))
        return results
