import re
from typing import List, Dict, Any, Tuple

class ChunkingStrategy:
    """Base class for chunking strategies."""
    def chunk(self, text: str) -> List[Dict[str, Any]]:
        raise NotImplementedError

class FixedSizeChunker(ChunkingStrategy):
    """Strategy A: Fixed character/token window chunking with overlap."""
    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk(self, text: str) -> List[Dict[str, Any]]:
        chunks = []
        start = 0
        text_len = len(text)
        chunk_id = 0
        while start < text_len:
            end = min(start + self.chunk_size, text_len)
            chunk_text = text[start:end]
            chunks.append({
                "chunk_id": chunk_id,
                "strategy": "fixed",
                "text": chunk_text,
                "start": start,
                "end": end
            })
            chunk_id += 1
            start += self.chunk_size - self.overlap
            if start >= text_len - self.overlap and start > 0:
                break
        return chunks

class SentenceChunker(ChunkingStrategy):
    """Strategy B: Sentence-based chunking using script-aware regex boundaries."""
    def __init__(self, max_sentences_per_chunk: int = 3):
        self.max_sentences = max_sentences_per_chunk

    def chunk(self, text: str) -> List[Dict[str, Any]]:
        # Regex split for standard punctuation and Indic danda (।)
        sentences = re.split(r'(?<=[.?!।])\s+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        chunks = []
        for i in range(0, len(sentences), self.max_sentences):
            group = sentences[i:i + self.max_sentences]
            chunk_text = " ".join(group)
            chunks.append({
                "chunk_id": len(chunks),
                "strategy": "sentence",
                "text": chunk_text,
                "sentence_count": len(group)
            })
        return chunks

class ParagraphChunker(ChunkingStrategy):
    """Strategy C: Paragraph / semantic boundary chunking."""
    def chunk(self, text: str) -> List[Dict[str, Any]]:
        paragraphs = text.split("\n\n")
        paragraphs = [p.strip() for p in paragraphs if p.strip()]
        if not paragraphs:
            paragraphs = [text]
            
        chunks = []
        for idx, para in enumerate(paragraphs):
            chunks.append({
                "chunk_id": idx,
                "strategy": "paragraph",
                "text": para
            })
        return chunks

class SemanticSimilarityChunker(ChunkingStrategy):
    """Strategy D: Semantic chunking based on sentence embeddings distance."""
    def __init__(self, similarity_threshold: float = 0.7):
        self.threshold = similarity_threshold

    def chunk(self, text: str) -> List[Dict[str, Any]]:
        sentences = re.split(r'(?<=[.?!।])\s+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        # Fallback or stub for embedding similarity boundary grouping
        chunks = []
        current_chunk = []
        for s in sentences:
            current_chunk.append(s)
            if len(current_chunk) >= 2:  # Boundary grouping stub
                chunks.append({
                    "chunk_id": len(chunks),
                    "strategy": "semantic_similarity",
                    "text": " ".join(current_chunk)
                })
                current_chunk = []
                
        if current_chunk:
            chunks.append({
                "chunk_id": len(chunks),
                "strategy": "semantic_similarity",
                "text": " ".join(current_chunk)
            })
        return chunks

class ParentChildChunker(ChunkingStrategy):
    """Strategy E: Multi-resolution / Parent-Child hierarchical chunking."""
    def __init__(self, parent_size: int = 800, child_size: int = 200, child_overlap: int = 30):
        self.parent_size = parent_size
        self.child_size = child_size
        self.child_overlap = child_overlap

    def chunk(self, text: str) -> List[Dict[str, Any]]:
        parent_chunker = FixedSizeChunker(chunk_size=self.parent_size, overlap=50)
        child_chunker = FixedSizeChunker(chunk_size=self.child_size, overlap=self.child_overlap)
        
        parents = parent_chunker.chunk(text)
        hierarchical_chunks = []
        
        for parent in parents:
            parent_id = parent["chunk_id"]
            children = child_chunker.chunk(parent["text"])
            for child in children:
                hierarchical_chunks.append({
                    "parent_id": parent_id,
                    "child_id": child["chunk_id"],
                    "strategy": "parent_child",
                    "parent_text": parent["text"],
                    "child_text": child["text"]
                })
        return hierarchical_chunks
