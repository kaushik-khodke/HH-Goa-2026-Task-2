import json
from pathlib import Path
from typing import Dict, List, Any, Optional
from datasets import load_dataset
from src.config.config import settings, EVAL_DATA_DIR

# Map language codes to Hugging Face parquet file prefixes
LANG_PARQUET_PREFIX = {
    'as': 'asm',
    'bn': 'ben',
    'gu': 'guj',
    'hi': 'hin',
    'kn': 'kan',
    'ml': 'mal',
    'mr': 'mar',
    'ne': 'nep',
    'or': 'ori',
    'pa': 'pan',
    'sa': 'san',
    'ta': 'tam',
    'te': 'tel',
    'ur': 'urd'
}

class MSMARCOLoader:
    def __init__(self, dataset_name: str = settings.dataset_name):
        self.dataset_name = dataset_name

    def load_language_split(self, lang_code: str, split: str = "validation") -> List[Dict[str, Any]]:
        """Load a specific language split using HF data_files parameter."""
        prefix = LANG_PARQUET_PREFIX.get(lang_code, "hin")
        split_short = "val" if split.startswith("val") else "train"
        file_path = f"{split}/{prefix}{split_short}.parquet"
        
        print(f"Loading '{lang_code}' dataset split via data_files='{file_path}'...")
        try:
            ds = load_dataset(self.dataset_name, data_files=file_path, split="train")
            return [dict(example) for example in ds]
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            return []

    def build_evaluation_subset(
        self, 
        lang_codes: List[str] = ["hi", "bn", "ta"], 
        sample_per_lang: int = 100, 
        output_file: Optional[Path] = None
    ) -> List[Dict[str, Any]]:
        """Construct a zero-data-leakage evaluation subset for benchmark experiments."""
        eval_records = []
        output_path = output_file or (EVAL_DATA_DIR / "multilingual_eval_subsets.json")
        
        for lang in lang_codes:
            records = self.load_language_split(lang, split="validation")
            sampled = records[:sample_per_lang]
            for idx, rec in enumerate(sampled):
                passages = rec.get("passages", {})
                is_sel = passages.get("is_selected", [])
                trans_passages = passages.get("Translated_passages", [])
                
                pos_idx = is_sel.index(1) if 1 in is_sel else -1
                pos_passage = trans_passages[pos_idx] if pos_idx >= 0 and pos_idx < len(trans_passages) else ""
                
                eval_records.append({
                    "eval_id": f"{lang}_{rec.get('query_id', idx)}",
                    "lang": lang,
                    "query_id": rec.get("query_id"),
                    "query_type": rec.get("query_type", "UNKNOWN"),
                    "query": rec.get("query", ""),
                    "eng_query": rec.get("Eng_Query", ""),
                    "answer": rec.get("Answer", ""),
                    "eng_answer": rec.get("Eng_Answer", ""),
                    "passages": trans_passages,
                    "eng_passages": passages.get("English_passages", []),
                    "is_selected": is_sel,
                    "ground_truth_passage": pos_passage,
                    "ground_truth_index": pos_idx
                })
                
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(eval_records, f, ensure_ascii=False, indent=2)
            
        print(f"Successfully created evaluation subset with {len(eval_records)} samples at {output_path}")
        return eval_records
