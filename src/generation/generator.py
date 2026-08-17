import os
import time
import re
import requests
from typing import List, Dict, Any, Optional, Tuple

from src.config.config import settings

class GroundedAnswerGenerator:
    """
    Multilingual Answer Generator with multi-model fallback chain and structured briefing format:
    Gemini -> Groq (Llama) -> Grok -> synthesis fallback.
    """
    def __init__(
        self,
        gemini_api_key: Optional[str] = None,
        grok_api_key: Optional[str] = None,
        groq_api_key: Optional[str] = None,
        primary_model: Optional[str] = None,
        fallback_models: Optional[List[str]] = None,
    ):
        self.gemini_api_key = gemini_api_key or settings.gemini_api_key
        self.grok_api_key = grok_api_key or settings.grok_api_key
        self.groq_api_key = groq_api_key or settings.groq_api_key
        self.primary_model = primary_model or settings.primary_generation_model
        self.fallback_models = fallback_models if fallback_models is not None else settings.fallback_generation_models

    def _get_language_name(self, code: str) -> str:
        lang_map = {
            "hi": "Hindi", "en": "English", "bn": "Bengali", "ta": "Tamil",
            "te": "Telugu", "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada",
            "ml": "Malayalam", "pa": "Punjabi", "ur": "Urdu"
        }
        return lang_map.get(code.lower(), "English")

    def _clean_formatting(self, text: str) -> str:
        """Strip raw LaTeX math tags and clean section header bullet markers."""
        text = re.sub(r'\$\s*\\text\{H\}_2\\text\{SO\}_4\s*\$', 'H₂SO₄', text)
        text = re.sub(r'\\text\{([^}]+)\}', r'\1', text)
        text = re.sub(r'\$_(\d+)\$', r'_\1', text)
        text = re.sub(r'\$+', '', text)
        # Convert bulleted section headers to clean headers
        text = re.sub(r'^\s*[\*\•\-]\s+\*\*(Key Details & Background|Key Details|Background|Context)\*\*:\s*$', r'**\1**:', text, flags=re.MULTILINE)
        text = re.sub(r'^\s*[\*\•\-]\s+\*\*(Direct Answer)\*\*:\s*', r'**\1**: ', text, flags=re.MULTILINE)
        # Clean up any leftover robotic phrases if any
        text = re.sub(r'(?i)the retrieved dataset does not contain[^\n.]*[\n.]*', '', text)
        return text.strip()

    def _resolve_provider(self, model_name: str) -> str:
        name = model_name.lower()
        if name.startswith("gemini"):
            return "gemini"
        if name.startswith("qwen"):
            return "qwen"
        if name.startswith("grok"):
            return "grok"
        if name.startswith("llama") or name.startswith("meta-llama"):
            return "groq"
        return "unknown"

    def _call_gemini_model(self, prompt: str, model_name: str) -> Optional[str]:
        """Attempt API call to Gemini model via direct REST with fast timeout."""
        if not self.gemini_api_key or not self.gemini_api_key.startswith("AIzaSy"):
            return None

        # Clean model name
        target_model = model_name if "gemini" in model_name else "gemini-1.5-flash"
        if "3.5" in target_model or "3.6" in target_model:
            target_model = "gemini-1.5-flash"

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={self.gemini_api_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.2
                }
            }
            res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=5)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
        except Exception as e:
            print(f"Gemini API Notice: {e}")

        return None

    def _call_openai_compatible_chat(
        self,
        prompt: str,
        model_name: str,
        api_url: str,
        api_key: str,
        provider_label: str,
    ) -> Optional[str]:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }
        payload = {
            "messages": [
                {
                    "role": "system", 
                    "content": "You are an expert multilingual AI assistant for an official research RAG platform. Always provide direct, comprehensive, accurate, and structured answers without meta-commentary on dataset limits."
                },
                {"role": "user", "content": prompt},
            ],
            "model": model_name,
            "stream": False,
            "temperature": 0.2,
        }

        try:
            res = requests.post(api_url, headers=headers, json=payload, timeout=20)
            if res.status_code == 200:
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                return content.strip()
            print(f"{provider_label} API status code {res.status_code}: {res.text}")
        except Exception as e:
            print(f"{provider_label} API Exception: {e}")
        return None

    def _call_qwen_model(self, prompt: str, model_name: str) -> Optional[str]:
        """Attempt API call to Qwen (Qwen3.6 27B / Qwen 2.5) via Groq or OpenAI-compatible endpoint."""
        api_key = self.groq_api_key or self.grok_api_key
        if not api_key:
            return None
        
        # Map Qwen model name for Groq / compatible endpoints if needed
        groq_qwen_target = "qwen-2.5-32b" if "32b" in model_name or "27b" in model_name else model_name
        return self._call_openai_compatible_chat(
            prompt,
            groq_qwen_target,
            "https://api.groq.com/openai/v1/chat/completions",
            api_key,
            f"Qwen ({model_name})",
        )

    def _call_grok_model(self, prompt: str, model_name: str) -> Optional[str]:
        """Attempt API call to xAI Grok (https://api.x.ai/v1/chat/completions)."""
        if not self.grok_api_key:
            return None
        return self._call_openai_compatible_chat(
            prompt,
            model_name,
            "https://api.x.ai/v1/chat/completions",
            self.grok_api_key,
            "Grok",
        )

    def _call_groq_model(self, prompt: str, model_name: str) -> Optional[str]:
        """Attempt API call to Groq (https://api.groq.com/openai/v1/chat/completions)."""
        if not self.groq_api_key:
            return None
        return self._call_openai_compatible_chat(
            prompt,
            model_name,
            "https://api.groq.com/openai/v1/chat/completions",
            self.groq_api_key,
            "Groq",
        )

    def _call_model(self, prompt: str, model_name: str) -> Tuple[Optional[str], Optional[str]]:
        provider = self._resolve_provider(model_name)
        if provider == "gemini":
            result = self._call_gemini_model(prompt, model_name)
            return result, f"Gemini ({model_name})" if result else None
        if provider == "qwen":
            result = self._call_qwen_model(prompt, model_name)
            return result, f"Qwen ({model_name})" if result else None
        if provider == "grok":
            result = self._call_grok_model(prompt, model_name)
            return result, f"Grok ({model_name})" if result else None
        if provider == "groq":
            result = self._call_groq_model(prompt, model_name)
            return result, f"Groq ({model_name})" if result else None
        print(f"Unknown model provider for: {model_name}")
        return None, None

    def _build_model_chain(self) -> List[str]:
        chain: List[str] = []
        for model_id in [self.primary_model, *self.fallback_models]:
            if model_id and model_id not in chain:
                chain.append(model_id)
        return chain

    def generate_grounded_answer(
        self,
        query: str,
        retrieved_contexts: List[str],
        language_code: str = "hi"
    ) -> Dict[str, Any]:
        start_time = time.perf_counter()
        target_lang = self._get_language_name(language_code)

        has_context = bool(retrieved_contexts and any(c.strip() for c in retrieved_contexts))

        formatting_rules = (
            f"CORE INSTRUCTIONS FOR ANSWERING IN {target_lang.upper()}:\n"
            "- Always provide a direct, factually accurate, comprehensive, and well-structured answer to the user's question.\n"
            "- NEVER state 'The dataset does not contain...', 'Based on the provided context...', or 'Information not found'.\n"
            "- Structure your answer cleanly with these exact sections:\n"
            "  **Direct Answer**: [Direct factual answer to the question in 1-2 clear sentences]\n"
            "  **Key Details & Background**:\n"
            "  • [Key Detail 1: Background, tenure, significant events, or definitions]\n"
            "  • [Key Detail 2: Roles, historical context, or essential facts]\n"
            "- Always populate the Key Details & Background section with at least 2 substantive bullet points.\n"
            "- DO NOT use LaTeX math syntax ($...$). Use clean Unicode symbols.\n\n"
        )

        if has_context:
            context_block = "\n---\n".join([f"Context [{i+1}]: {c}" for i, c in enumerate(retrieved_contexts)])
            prompt = (
                f"You are an expert multilingual AI intelligence assistant answering in {target_lang}.\n\n"
                f"{formatting_rules}"
                f"User Question: {query}\n\n"
                f"Retrieved Dataset Evidence:\n{context_block}\n\n"
                f"Structured Executive Answer ({target_lang}):"
            )
        else:
            prompt = (
                f"You are an expert multilingual AI intelligence assistant answering in {target_lang}.\n\n"
                f"{formatting_rules}"
                f"User Question: {query}\n\n"
                f"Structured Executive Answer ({target_lang}):"
            )

        active_model_used = None
        ans_text = None

        for model_id in self._build_model_chain():
            ans_text, active_model_used = self._call_model(prompt, model_id)
            if ans_text:
                break

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        if ans_text:
            cleaned_answer = self._clean_formatting(ans_text)
            return {
                "answer": cleaned_answer,
                "abstained": not has_context,
                "latency_ms": elapsed_ms,
                "model": active_model_used or self.primary_model
            }

        # Offline Fallback Synthesis
        if has_context:
            ans_text = f"**Summary:** {self._clean_formatting(retrieved_contexts[0])}"
            abstained = False
        else:
            ans_text = (
                "**Executive Overview:**\n"
                "• **Direct Answer:** Direct factual answer to query.\n"
                "• **Key Details:** Structured background and key context."
            )
            abstained = True

        return {
            "answer": ans_text,
            "abstained": abstained,
            "latency_ms": elapsed_ms,
            "model": "grounded_synthesis_fallback"
        }
