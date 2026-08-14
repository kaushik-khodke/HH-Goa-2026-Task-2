export interface StageLatency {
  stt_ms: number;
  query_proc_ms: number;
  sparse_retrieval_ms: number;
  dense_retrieval_ms: number;
  fusion_ms: number;
  rerank_ms: number;
  generation_ms: number;
  guardrail_ms: number;
  total_ms: number;
}

export interface RetrievedSourceItem {
  num: number;
  passage_id: string;
  text: string;
  relevance_score: number;
}

export interface PipelineResponse {
  query: string;
  language: string;
  transcription_confidence: number;
  answer: string;
  retrieved_contexts: string[];
  retrieved_sources?: RetrievedSourceItem[];
  is_grounded: boolean;
  grounding_score: number;
  confidence_label?: string;
  tokens_used?: number;
  abstained: boolean;
  latency_breakdown: StageLatency;
}

export interface PipelineRequest {
  text_query?: string;
  language_code: string;
  top_k_retrieval?: number;
  top_k_rerank?: number;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  sttLang: string;
}

export type PipelineStageStatus = 'idle' | 'stt' | 'retrieval' | 'rerank' | 'generation' | 'grounding' | 'complete' | 'error';
