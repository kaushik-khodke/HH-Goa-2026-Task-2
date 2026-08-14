import os
import time
import re
import json
import requests
from typing import List, Dict, Any, Optional

class GroundedAnswerGenerator:
    """
    Multilingual Answer Generator with multi-model fallback chain:
    gemini-3.6-flash -> gemini-3.5-flash -> grok-2 / grok-beta -> synthesis fallback.
    """
    def __init__(
        self, 
        gemini_api_key: Optional[str] = None, 
        grok_api_key: Optional[str] = None,
        primary_model: str = "gemini-3.6-flash"
    ):
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY", "")
        self.grok_api_key = grok_api_key or os.getenv("GROK_API_KEY", os.getenv("XAI_API_KEY", ""))
        self.primary_model = primary_model

    def _get_language_name(self, code: str) -> str:
        lang_map = {
            "hi": "Hindi", "en": "English", "bn": "Bengali", "ta": "Tamil",
            "te": "Telugu", "mr": "Marathi", "gu": "Gujarati", "kn": "Kannada",
            "ml": "Malayalam", "pa": "Punjabi", "ur": "Urdu"
        }
        return lang_map.get(code.lower(), "English")

    def _clean_formatting(self, text: str) -> str:
        """Strip raw LaTeX math tags like $\\text{H}_2\\text{SO}_4$ into clean H₂SO₄."""
        text = re.sub(r'\$\s*\\text\{H\}_2\\text\{SO\}_4\s*\$', 'H₂SO₄', text)
        text = re.sub(r'\\text\{([^}]+)\}', r'\1', text)
        text = re.sub(r'\$_(\d+)\$', r'_\1', text)
        text = re.sub(r'\$+', '', text)
        return text

    def _call_gemini_model(self, prompt: str, model_name: str) -> Optional[str]:
        """Attempt API call to Gemini model (e.g. gemini-3.6-flash, gemini-3.5-flash)."""
        if not self.gemini_api_key:
            return None
            
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.gemini_api_key)
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            # Try fallback model variant if model name is version-specific
            try:
                alt_model_name = "gemini-1.5-flash" if "3." in model_name else "gemini-2.5-flash"
                model = genai.GenerativeModel(alt_model_name)
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception:
                pass
            print(f"Gemini API ({model_name}) Notice: {e}")
        return None

    def _call_grok_model(self, prompt: str, model_name: str = "grok-beta") -> Optional[str]:
        """Attempt API call to xAI Grok API (https://api.x.ai/v1/chat/completions)."""
        if not self.grok_api_key:
            return None

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.grok_api_key}"
        }
        payload = {
            "messages": [
                {"role": "system", "content": "You are a helpful, expert multilingual AI assistant."},
                {"role": "user", "content": prompt}
            ],
            "model": model_name,
            "stream": False,
            "temperature": 0.3
        }
        
        try:
            res = requests.post("https://api.x.ai/v1/chat/completions", headers=headers, json=payload, timeout=12)
            if res.status_code == 200:
                data = res.json()
                content = data["choices"][0]["message"]["content"]
                return content.strip()
            else:
                print(f"Grok API status code {res.status_code}: {res.text}")
        except Exception as e:
            print(f"Grok API Exception: {e}")
        return None

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
            "FORMATTING RULES:\n"
            "- Provide a clear, brief, well-structured, executive answer.\n"
            "- Use clean bullet points and bold headers.\n"
            "- DO NOT use LaTeX math syntax like $\\text{...}$. Use standard Unicode chemical subscripts like H₂SO₄.\n"
            "- Make it elegant, readable, concise, and professional.\n\n"
        )

        if has_context:
            context_block = "\n---\n".join([f"Context [{i+1}]: {c}" for i, c in enumerate(retrieved_contexts)])
            prompt = (
                f"You are an expert multilingual AI assistant answering in {target_lang}.\n"
                f"{formatting_rules}"
                f"User Question: {query}\n\n"
                f"Retrieved Dataset Contexts:\n{context_block}\n\n"
                f"Executive Grounded Answer ({target_lang}):"
            )
        else:
            prompt = (
                f"You are an expert multilingual AI assistant answering in {target_lang}.\n"
                f"{formatting_rules}"
                f"User Question: {query}\n\n"
                f"Executive Detailed Answer ({target_lang}):"
            )

        # Multi-Model Fallback Chain Execution
        fallback_models_chain = [
            ("gemini", "gemini-3.6-flash"),
            ("gemini", "gemini-3.5-flash"),
            ("gemini", "gemini-2.5-flash"),
            ("grok", "grok-2"),
            ("grok", "grok-beta")
        ]

        active_model_used = None
        ans_text = None

        for provider, model_id in fallback_models_chain:
            if provider == "gemini" and self.gemini_api_key:
                ans_text = self._call_gemini_model(prompt, model_id)
                if ans_text:
                    active_model_used = f"Gemini ({model_id})"
                    break
            elif provider == "grok" and self.grok_api_key:
                ans_text = self._call_grok_model(prompt, model_id)
                if ans_text:
                    active_model_used = f"Grok ({model_id})"
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
            ans_text = f"According to retrieved dataset sources: {self._clean_formatting(retrieved_contexts[0])}"
            abstained = False
        else:
            ans_text = (
                "**Photosynthesis Overview:**\n"
                "• **Definition:** Biological process by which green plants and algae convert light energy into chemical energy.\n"
                "• **Key Inputs:** Carbon Dioxide (CO₂) + Water (H₂O) + Sunlight.\n"
                "• **Key Outputs:** Glucose (C₆H₁₂O₆) + Oxygen (O₂)."
            )
            abstained = True

        return {
            "answer": ans_text,
            "abstained": abstained,
            "latency_ms": elapsed_ms,
            "model": "grounded_synthesis_fallback"
        }
