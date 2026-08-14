import { PipelineRequest, PipelineResponse } from '../types/rag';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchTextQuery(request: PipelineRequest): Promise<PipelineResponse> {
  const res = await fetch(`${API_BASE_URL}/api/v1/query/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

  return res.json();
}

export async function fetchVoiceQuery(audioBlob: Blob, languageCode: string): Promise<PipelineResponse> {
  const formData = new FormData();
  formData.append('file', audioBlob, 'speech.wav');
  formData.append('language_code', languageCode);

  const res = await fetch(`${API_BASE_URL}/api/v1/query/voice`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`API Error ${res.status}: Failed to process voice audio query`);
  }

  return res.json();
}

export async function checkBackendHealth(): Promise<{ status: string; corpus_passages_loaded?: number }> {
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
