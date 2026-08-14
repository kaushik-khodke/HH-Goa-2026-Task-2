import { LanguageOption } from '../types/rag';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', sttLang: 'en-US' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', sttLang: 'hi-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', sttLang: 'bn-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', sttLang: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', sttLang: 'te-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', sttLang: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', sttLang: 'gu-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', sttLang: 'kn-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', sttLang: 'ml-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', sttLang: 'pa-IN' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', sttLang: 'ur-IN' },
];

export function cleanMarkdownText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\$\s*\\text\{([^}]+)\}_(\d+)\s*\\text\{([^}]+)\}_(\d+)\s*\$/g, '$1₂$3₄')
    .replace(/\$\\text\{([^}]+)\}\$/g, '$1')
    .replace(/\$+/g, '');
}

export function formatLatencyMs(ms: number): string {
  if (!ms || isNaN(ms)) return '0.0 ms';
  return `${ms.toFixed(1)} ms`;
}
