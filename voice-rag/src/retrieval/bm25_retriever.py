import re
import math
from typing import List, Dict, Any, Tuple

try:
    from rank_bm25 import BM25Okapi
except ImportError:
    # Pure-Python Fallback BM25 Implementation if rank_bm25 package is not installed
    class BM25Okapi:
        def __init__(self, corpus: List[List[str]], k1: float = 1.5, b: float = 0.75):
            self.k1 = k1
            self.b = b
            self.corpus_size = len(corpus)
            self.avgdl = sum(len(doc) for doc in corpus) / self.corpus_size if self.corpus_size > 0 else 1.0
            self.doc_freqs = []
            self.idf = {}
            self.doc_len = []
            
            # Calculate term frequencies & document lengths
            df = {}
            for doc in corpus:
                self.doc_len.append(len(doc))
                freqs = {}
                for word in doc:
                    freqs[word] = freqs.get(word, 0) + 1
                self.doc_freqs.append(freqs)
                for word in freqs:
                    df[word] = df.get(word, 0) + 1

            # Calculate IDF
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
    """Sparse retrieval engine using BM25 with Indic tokenization."""
    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.bm25 = None
        self.corpus_passages: List[Dict[str, Any]] = []

    def _tokenize(self, text: str) -> List[str]:
        """Simple whitespace and punctuation tokenizer for Indic and English text."""
        cleaned = re.sub(r'[^\w\s]', ' ', text.lower())
        tokens = [t.strip() for t in cleaned.split() if t.strip()]
        return tokens

    def index_corpus(self, corpus_passages: List[Dict[str, Any]]):
        """Index corpus passage dictionary objects containing 'passage_id' and 'text'."""
        self.corpus_passages = corpus_passages
        tokenized_corpus = [self._tokenize(p["text"]) for p in corpus_passages]
        self.bm25 = BM25Okapi(tokenized_corpus, k1=self.k1, b=self.b)

    def retrieve(self, query: str, top_k: int = 10) -> List[Tuple[Dict[str, Any], float]]:
        if not self.bm25:
            raise ValueError("BM25 index has not been built yet.")
            
        tokenized_query = self._tokenize(query)
        scores = self.bm25.get_scores(tokenized_query)
        
        # Rank top_k
        top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:top_k]
        results = [(self.corpus_passages[idx], float(scores[idx])) for idx in top_indices]
        return results
