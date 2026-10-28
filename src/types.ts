export type MasteryLevel = 0 | 1 | 2 | 3; // 0: 未收录, 1: 已加入单词集, 2: 熟悉/学习中, 3: 已掌握

export type VocabDifficultyTag = 'IELTS 7.5+' | 'IELTS 6.5+' | 'TOEFL' | 'CET-6' | 'CET-4' | 'General';

export interface WordExample {
  en: string;
  cn: string;
  source?: string;
}

export interface SubWordItem {
  id?: number;
  word: string;
  phoneticUk: string;
  phoneticUs: string;
  partOfSpeech: string;
  definition: string;
  definitionCn: string;
  examples: WordExample[];
  sourceContext?: string;
  dateKey?: string;
  isStarred: boolean;
  masteryLevel?: MasteryLevel; // 0: 新学 (New), 1: 熟悉中 (Learning), 2: 已掌握 (Mastered)
  addedTimestamp: number;
  lastReviewedTimestamp?: number;
  reviewCount?: number;
  categories?: string[];
  aiTags?: string[];
  parentPhrase?: string;
}

export interface WordItem {
  id?: number;
  word: string;
  phoneticUk: string;
  phoneticUs: string;
  partOfSpeech: string;
  definition: string;
  definitionCn: string;
  examples: WordExample[];
  sourceContext?: string; // e.g. "Song: Jasmine Breeze", "AR: Desk Object", "Passage 2"
  dateKey?: string;
  isStarred: boolean;
  masteryLevel?: MasteryLevel; // 0: 新学 (New), 1: 熟悉中 (Learning), 2: 已掌握 (Mastered)
  addedTimestamp: number;
  lastReviewedTimestamp?: number;
  reviewCount?: number;
  categories?: string[];
  aiTags?: string[];
  isPhrase?: boolean;
  parentPhrase?: string;
  subWords?: SubWordItem[];
  arObjectLabel?: string;
}

export interface SongVocabStats {
  totalWords: number;
  academicCount: number;
  ieltsCount: number;
  toeflCount: number;
  cet6Count: number;
  matchedNotebookCount: number;
  matchedDueCount?: number;
  dueWords?: string[];
}

export interface SongItem {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  albumArtUrl: string;
  audioUrl: string;
  lrcText: string;
  tlyricText?: string;
  palette: [string, string, string]; // [glow1, glow2, glow3]
  keyVocab: string[];
  vocabLevel?: VocabDifficultyTag;
  vocabStats?: SongVocabStats;
}

export interface LyricSpan {
  text: string;
  startMs: number;
  endMs: number;
}

export interface LyricLine {
  timeMs: number;
  rawText: string;
  translation?: string;
  spans: LyricSpan[];
}

export type IELTSQuestionType = 'TFNG' | 'SUMMARY_COMPLETION' | 'MULTIPLE_CHOICE' | 'FORM_COMPLETION' | 'MATCHING_HEADINGS';

export interface IELTSQuestion {
  id: number;
  type: IELTSQuestionType;
  prompt: string;
  options?: string[]; // For TFNG: ['TRUE', 'FALSE', 'NOT GIVEN'], for MC: options, for matching: options
  correctAnswer: string;
  explanation: string;
  targetVocab?: string;
  blankLabel?: string;
}

export interface IELTSTestRecord {
  id?: number;
  timestamp: number;
  bandScore: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSec: number;
  standardTimeSec?: number; // Official standard 20:00 (1200 sec)
  extensionCount?: number; // Times timer was extended
  totalAddedSeconds?: number; // Total added seconds
  isOvertime?: boolean; // True if extended or timed out
  passageTitle: string;
  passageSubtitle: string;
  passageText: string;
  questions: IELTSQuestion[];
  answers: Record<number, string>;
  conqueredWords: string[];
}

export interface ARDetectedObject {
  id: string;
  label: string;
  phonetic: string;
  pos: { x: number; y: number; z: number };
  confidence: number;
  wordData: WordItem;
  isLiteTag?: boolean;
  isProTag?: boolean;
}

export type MajorAIProvider = 'gemini' | 'deepseek' | 'openai' | 'claude' | 'kimi' | 'qwen' | 'glm' | 'custom';
export type AIProviderType = 'gemini' | 'openai_compatible';

export type AudioQuality = 'standard' | 'higher' | 'exhigh' | 'lossless' | 'hires';

export interface AudioQualityOption {
  key: AudioQuality;
  label: string;
  bitrate: string;
  badge: string;
  desc: string;
  vipOnly?: boolean;
}

export const AUDIO_QUALITY_OPTIONS: AudioQualityOption[] = [
  { key: 'standard', label: '标准', bitrate: '128 kbps', badge: '128K', desc: '流畅省流 · 适合移动网络与极速加载' },
  { key: 'higher', label: '较高', bitrate: '192 kbps', badge: '192K', desc: '均衡音质 · 声学细节层次分明' },
  { key: 'exhigh', label: '极高', bitrate: '320 kbps', badge: '320K', desc: '高保真立体声 · 推荐纯享' },
  { key: 'lossless', label: 'SQ 无损', bitrate: 'FLAC 16bit', badge: 'SQ', desc: 'CD 级原声 · 沉浸式听觉还原', vipOnly: true },
  { key: 'hires', label: 'Hi-Res', bitrate: '24bit/96kHz+', badge: 'Hi-Res', desc: '母带级超高清 · 录音棚原质重现', vipOnly: true }
];

export interface AIProviderConfig {
  majorProvider?: MajorAIProvider; // 'gemini' | 'deepseek' | 'openai' | 'claude' | 'custom'
  provider: AIProviderType; // 'gemini' | 'openai_compatible'
  
  // Gemini settings
  geminiModel: string;
  geminiApiKey?: string;

  // OpenAI / Compatible / Claude / DeepSeek
  customBaseUrl: string;
  customApiKey: string;
  customModel: string;

  // Detected models cache
  detectedModels?: string[];
  lastCheckedLatency?: number;
  lastCheckedTime?: number;
}
