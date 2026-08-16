'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Sidebar, { NavTab } from '../components/Sidebar';
import Header from '../components/Header';
import HeroQueryCard from '../components/HeroQueryCard';
import PipelineStatusCard from '../components/PipelineStatusCard';
import AnswerSourcesCard from '../components/AnswerSourcesCard';
import BottomMetricsCards from '../components/BottomMetricsCards';
import NavigationModals, { DetailedPassage } from '../components/NavigationModals';

import { PipelineResponse, PipelineStageStatus } from '../lib/types/rag';
import { fetchTextQuery, fetchVoiceQuery, checkBackendHealth, fetchCorpusPassages } from '../lib/api/client';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('ask');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [queryText, setQueryText] = useState<string>('');
  const [stage, setStage] = useState<PipelineStageStatus>('idle');
  const [result, setResult] = useState<PipelineResponse | null>(null);

  const [historyItems, setHistoryItems] = useState<Array<{ query: string; answer: string; time: string }>>([]);
  const [chunkCount, setChunkCount] = useState(15);
  const [isBackendReady, setIsBackendReady] = useState(true);
  const [corpusPassages, setCorpusPassages] = useState<DetailedPassage[]>([]);

  // Check backend health, chunk count, and load all corpus passages dynamically
  useEffect(() => {
    checkBackendHealth().then((h) => {
      if (h.status === 'healthy') {
        setIsBackendReady(true);
        if (h.corpus_passages_loaded) setChunkCount(h.corpus_passages_loaded);
      } else {
        setIsBackendReady(false);
      }
    });

    fetchCorpusPassages().then((passages) => {
      if (passages && passages.length > 0) {
        setCorpusPassages(passages);
        setChunkCount(passages.length);
      } else {
        // High quality fallback dataset preview
        const fallbackSubsets: DetailedPassage[] = [
          {
            passage_id: 'hi_1185869_chunk_0',
            language: 'hi',
            query_type: 'DESCRIPTION',
            associated_query: 'मैनहट्टन परियोजना की सफलता का तत्काल प्रभाव क्या था?',
            associated_eng_query: 'what was the immediate impact of the success of the manhattan project?',
            text: 'मैनहट्टन परियोजना द्वितीय विश्व युद्ध के दौरान एक शोध और विकास उपक्रम था जिसने पहले परमाणु हथियारों का निर्माण किया। इसका नेतृत्व संयुक्त राज्य अमेरिका ने किया था।',
            raw_text: 'मैनहट्टन परियोजना द्वितीय विश्व युद्ध के दौरान एक शोध और विकास उपक्रम था जिसने पहले परमाणु हथियारों का निर्माण किया। इसका नेतृत्व संयुक्त राज्य अमेरिका ने किया था।',
            char_count: 147,
            token_estimate: 28,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'hi_1185869_chunk_1',
            language: 'hi',
            query_type: 'DESCRIPTION',
            associated_query: 'मैनहट्टन परियोजना की सफलता का तत्काल प्रभाव क्या था?',
            associated_eng_query: 'what was the immediate impact of the success of the manhattan project?',
            text: 'वैज्ञानकों के बीच संचार की उपस्थिति ने तकनीक को तेज़ी से विकसित किया।',
            raw_text: 'वैज्ञानकों के बीच संचार की उपस्थिति ने तकनीक को तेज़ी से विकसित किया।',
            char_count: 70,
            token_estimate: 14,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'hi_1185869_chunk_2',
            language: 'hi',
            query_type: 'DESCRIPTION',
            associated_query: 'मैनहट्टन परियोजना की सफलता का तत्काल प्रभाव क्या था?',
            associated_eng_query: 'what was the immediate impact of the success of the manhattan project?',
            text: 'मैनहट्टन परियोजना की सफलता का तात्कालिक प्रभाव द्वितीय विश्व युद्ध का अंत और परमाणु हथियारों के युग की शुरुआत थी।',
            raw_text: 'मैनहट्टन परियोजना की सफलता का तात्कालिक प्रभाव द्वितीय विश्व युद्ध का अंत और परमाणु हथियारों के युग की शुरुआत थी।',
            char_count: 116,
            token_estimate: 21,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'bn_204192_chunk_0',
            language: 'bn',
            query_type: 'NUMERIC',
            associated_query: 'সালফোরিক অ্যাসিডের সংকেত কি এবং এর আণবিক ভর কত?',
            associated_eng_query: 'what is the formula of sulfuric acid and its molecular weight?',
            text: 'সালফিউরিক অ্যাসিড একটি অত্যন্ত তীব্র খনিজ অ্যাসিড। এর রাসায়নিক সংকেত H2SO4।',
            raw_text: 'সালফিউরিক অ্যাসিড একটি অত্যন্ত তীব্র খনিজ অ্যাসিড। এর রাসায়নিক সংকেত H2SO4।',
            char_count: 77,
            token_estimate: 15,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'bn_204192_chunk_1',
            language: 'bn',
            query_type: 'NUMERIC',
            associated_query: 'সালফোরিক অ্যাসিডের সংকেত কি এবং এর আণবিক ভর কত?',
            associated_eng_query: 'what is the formula of sulfuric acid and its molecular weight?',
            text: 'হাইড্রোক্লোরিক অ্যাসিড মানব পাকস্থলীতে পাওয়া যায়।',
            raw_text: 'হাইড্রোক্লোরিক অ্যাসিড মানব পাকস্থলীতে পাওয়া যায়।',
            char_count: 49,
            token_estimate: 9,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'bn_204192_chunk_2',
            language: 'bn',
            query_type: 'NUMERIC',
            associated_query: 'সালফোরিক অ্যাসিডের সংকেত কি এবং এর আণবিক ভর কত?',
            associated_eng_query: 'what is the formula of sulfuric acid and its molecular weight?',
            text: 'নাইট্রিক অ্যাসিড স্বর্ণ ও রৌপ্য পরিশোধনে ব্যবহৃত হয়।',
            raw_text: 'নাইট্রিক অ্যাসিড স্বর্ণ ও রৌপ্য পরিশোধने ব্যবহৃত হয়।',
            char_count: 51,
            token_estimate: 9,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'ta_319501_chunk_0',
            language: 'ta',
            query_type: 'LOCATION',
            associated_query: 'இந்தியாவின் தலைநகரம் எது?',
            associated_eng_query: 'what is the capital of india?',
            text: 'மும்பை இந்தியாவின் நிதித் தலைநகரம் ஆகும்.',
            raw_text: 'மும்பை இந்தியாவின் நிதித் தலைநகரம் ஆகும்.',
            char_count: 40,
            token_estimate: 7,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'ta_319501_chunk_1',
            language: 'ta',
            query_type: 'LOCATION',
            associated_query: 'இந்தியாவின் தலைநகரம் எது?',
            associated_eng_query: 'what is the capital of india?',
            text: 'புது டெல்லி இந்தியாவின் தலைநகரம் மற்றும் அரசு மையம் ஆகும்.',
            raw_text: 'புது டெல்லி இந்தியாவின் தலைநகரம் மற்றும் அரசு மையம் ஆகும்.',
            char_count: 57,
            token_estimate: 9,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'ta_319501_chunk_2',
            language: 'ta',
            query_type: 'LOCATION',
            associated_query: 'இந்தியாவின் தலைநகரம் எது?',
            associated_eng_query: 'what is the capital of india?',
            text: 'சென்னை தமிழ்நாட்டின் தலைநகரம் ஆகும்.',
            raw_text: 'சென்னை தமிழ்நாட்டின் தலைநகரம் ஆகும்.',
            char_count: 36,
            token_estimate: 6,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'te_451009_chunk_0',
            language: 'te',
            query_type: 'DESCRIPTION',
            associated_query: 'అవతార్ సినిమా డైరెక్టర్ ఎవరు?',
            associated_eng_query: 'who directed the movie avatar?',
            text: 'అవతార్ చిత్రాన్ని జేమ్స్ కామెరూన్ దర్శకత్వం వహించారు.',
            raw_text: 'అవతార్ చిత్రాన్ని జేమ్స్ కామెరూన్ దర్శకత్వం వహించారు.',
            char_count: 52,
            token_estimate: 8,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'te_451009_chunk_1',
            language: 'te',
            query_type: 'DESCRIPTION',
            associated_query: 'అవతార్ సినిమా డైరెక్టర్ ఎవరు?',
            associated_eng_query: 'who directed the movie avatar?',
            text: 'ఈ సినిమా 2009 లో విడుదలై ప్రపంచవ్యాప్తంగా ఘనవిజయం సాధించింది.',
            raw_text: 'ఈ సినిమా 2009 లో విడుదలై ప్రపంచవ్యాప్తంగా ఘనవిజయం సాధించింది.',
            char_count: 61,
            token_estimate: 9,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'te_451009_chunk_2',
            language: 'te',
            query_type: 'DESCRIPTION',
            associated_query: 'అవతార్ సినిమా డైరెక్టర్ ఎవరు?',
            associated_eng_query: 'who directed the movie avatar?',
            text: 'జేమ్స్ కామెరూన్ టైటానిక్ చిత్రానికి కూడా దర్శకత్వం వహించారు.',
            raw_text: 'జేమ్స్ కామెరూన్ టైటానిక్ చిత్రానికి కూడా దర్శకత్వం వహించారు.',
            char_count: 58,
            token_estimate: 8,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'mr_591023_chunk_0',
            language: 'mr',
            query_type: 'DESCRIPTION',
            associated_query: 'भारताचे पहिले राष्ट्रपती कोण होते?',
            associated_eng_query: 'who was the first president of india?',
            text: 'डॉ. बी. आर. आंबेडकर हे घटनेचे शिल्पकार होते.',
            raw_text: 'डॉ. बी. आर. आंबेडकर हे घटनेचे शिल्पकार होते.',
            char_count: 45,
            token_estimate: 8,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'mr_591023_chunk_1',
            language: 'mr',
            query_type: 'DESCRIPTION',
            associated_query: 'भारताचे पहिले राष्ट्रपती कोण होते?',
            associated_eng_query: 'who was the first president of india?',
            text: 'पंडित जवाहरलाल नेहरू भारताचे पहिले पंतप्रधान होते.',
            raw_text: 'पंडित जवाहरलाल नेहरू भारताचे पहिले पंतप्रधान होते.',
            char_count: 50,
            token_estimate: 8,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
          {
            passage_id: 'mr_591023_chunk_2',
            language: 'mr',
            query_type: 'DESCRIPTION',
            associated_query: 'भारताचे पहिले राष्ट्रपती कोण होते?',
            associated_eng_query: 'who was the first president of india?',
            text: 'डॉ. राजेंद्र प्रसाद हे भारताचे पहिले राष्ट्रपती होते.',
            raw_text: 'डॉ. राजेंद्र प्रसाद हे भारताचे पहिले राष्ट्रपती होते.',
            char_count: 52,
            token_estimate: 8,
            chunk_strategy: 'ParagraphBoundaryChunker'
          },
        ];
        setCorpusPassages(fallbackSubsets);
      }
    });
  }, []);

  const handleTextSubmit = useCallback(
    async (overrideText?: string) => {
      const q = (overrideText || queryText).trim();
      if (!q) return;

      setQueryText(q);
      setStage('retrieval');

      try {
        setStage('rerank');
        const res = await fetchTextQuery({
          text_query: q,
          language_code: selectedLanguage,
        });

        setStage('generation');
        setResult(res);
        setStage('complete');

        setHistoryItems((prev) => [
          { query: q, answer: res.answer, time: 'Just now' },
          ...prev.slice(0, 14),
        ]);
      } catch (err: any) {
        console.error('API Query Error:', err);
        setStage('error');
      }
    },
    [queryText, selectedLanguage]
  );

  const isLoading = stage !== 'idle' && stage !== 'complete' && stage !== 'error';

  return (
    <div className="min-h-screen w-full flex bg-slate-50 text-slate-900 font-sans antialiased">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <Header chunkCount={chunkCount} isBackendReady={isBackendReady} />

        {/* Main Dashboard Canvas */}
        <main className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Hero Query Card */}
          <HeroQueryCard
            query={queryText}
            onQueryChange={setQueryText}
            onSubmit={() => handleTextSubmit()}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            currentStage={stage}
            isLoading={isLoading}
          />

          {/* Results Grid Workspace: Pipeline Status + Answer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left 4 Cols: Pipeline Status Card */}
            <div className="lg:col-span-4 flex flex-col">
              <PipelineStatusCard
                latency={result?.latency_breakdown}
                stage={stage}
              />
            </div>

            {/* Right 8 Cols: Answer & Sources Card */}
            <div className="lg:col-span-8 flex flex-col">
              <AnswerSourcesCard
                query={result?.query || queryText || 'Waiting for query...'}
                answer={result?.answer || (isLoading ? 'Processing query and generating grounded response...' : 'Speak via microphone or type your question above to execute the multilingual RAG pipeline.')}
                isGrounded={result?.is_grounded ?? true}
                groundingScore={result?.grounding_score ?? 0.0}
                confidenceLabel={result?.confidence_label ?? (isLoading ? 'Computing...' : 'Ready')}
                abstained={result?.abstained ?? false}
                latencyMs={result?.latency_breakdown?.total_ms || 0}
                contexts={result?.retrieved_contexts || []}
                sources={result?.retrieved_sources || []}
              />
            </div>
          </div>

          {/* Bottom 5 Stat Metrics Cards */}
          <BottomMetricsCards 
            latency={result?.latency_breakdown} 
            tokensUsed={result?.tokens_used}
          />
        </main>
      </div>

      {/* Interactive Navigation Modals */}
      <NavigationModals
        activeTab={activeTab}
        onClose={() => setActiveTab('ask')}
        historyItems={historyItems}
        onSelectQuery={(q) => {
          setQueryText(q);
          handleTextSubmit(q);
        }}
        corpusPassages={corpusPassages}
      />
    </div>
  );
}
