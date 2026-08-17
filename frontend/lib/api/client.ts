import { PipelineRequest, PipelineResponse } from '../types/rag';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchTextQuery(request: PipelineRequest): Promise<PipelineResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/query/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        text_query: request.text_query,
        language_code: request.language_code,
        top_k_retrieval: request.top_k_retrieval || 10,
        top_k_rerank: request.top_k_rerank || 4,
      }),
    });

    if (!res.ok) {
      throw new Error(`API Error ${res.status}: Failed to process text query`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchVoiceQuery(audioBlob: Blob, languageCode: string): Promise<PipelineResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const formData = new FormData();
    formData.append('file', audioBlob, 'speech.wav');
    formData.append('language_code', languageCode);

    const res = await fetch(`${API_BASE_URL}/api/v1/query/voice`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`API Error ${res.status}: Failed to process voice audio query`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function checkBackendHealth(): Promise<{ status: string; corpus_passages_loaded?: number; corpus_passages_chunked?: number }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
    if (res.ok) {
      return res.json();
    }
  } catch (err) {
    // Backend offline
  }
  return { status: 'offline' };
}

export async function fetchCorpusPassages(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/corpus/passages`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data.passages || [];
    }
  } catch (err) {
    console.error('Failed to fetch corpus passages from backend:', err);
  }
  return [];
}
