'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../lib/utils/formatters';

interface VoiceRecorderProps {
  selectedLanguage: string;
  onTranscript: (transcript: string) => void;
  onVoiceBlob: (blob: Blob) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({
  selectedLanguage,
  onTranscript,
  onVoiceBlob,
  disabled = false,
}: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState('Click microphone to speak');
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          setIsListening(true);
          setStatusText('Listening... Speak your question clearly.');
        };

        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          setStatusText(`Transcribed: "${text}"`);
          onTranscript(text);
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition notice:', event.error);
          setStatusText('Voice input complete. Click mic or type query.');
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [onTranscript]);

  const toggleRecording = async () => {
    if (disabled) return;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
    } else {
      const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

      if (recognitionRef.current) {
        recognitionRef.current.lang = langConfig.sttLang;
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already active
        }
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            onVoiceBlob(audioBlob);
            stream.getTracks().forEach((track) => track.stop());
          };

          mediaRecorder.start();
          setIsListening(true);
          setStatusText('Recording audio... Click mic to stop and search.');
        } catch (err) {
          setStatusText('Microphone permission denied.');
        }
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-2.5">
      <button
        type="button"
        disabled={disabled}
        onClick={toggleRecording}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
          isListening
            ? 'bg-rose-600 text-white shadow-rose-200 scale-105 animate-pulse'
            : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-blue-200 hover:scale-105 hover:shadow-lg'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isListening ? (
          <Volume2 className="h-9 w-9 text-white animate-pulse" />
        ) : (
          <Mic className="h-9 w-9 text-white font-bold" />
        )}
      </button>

      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        {isListening && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
        <span>{statusText}</span>
      </div>
    </div>
  );
}
