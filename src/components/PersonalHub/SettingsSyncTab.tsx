import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../db';
import { AIProviderType, MajorAIProvider, AIProviderConfig, SongItem, AudioQuality, AUDIO_QUALITY_OPTIONS } from '../../types';
import {
  analyzeSongVocab,
  prioritizeSongsByNotebook,
  prioritizeSongsByNotebookAndSpacedRepetition,
  evaluateSongVocabDifficulty,
  getDueReviewWords,
  isChineseSong
} from '../../utils/vocabEngine';
import { SEED_SONGS } from '../../db/seedData';
import { ChineseSongPromptModal } from '../MusicSpace/ChineseSongPromptModal';
import {
  fetchPlaylistClient,
  getNetEaseQrKeyClient,
  checkNetEaseQrStatusClient,
  fetchNetEaseUserProfileWithCookieClient,
  sendNetEaseCaptchaClient,
  loginNetEaseWithCaptchaClient,
  PlatformAuthProfile,
  getStoredPlatformAuth,
  saveStoredPlatformAuth,
  removeStoredPlatformAuth,
  SupportedMusicPlatform
} from '../../utils/clientMusicSync';

// Mastery status circle indicator matching the app design system (0: hollow, 1: needle-dot, 2: mid-dot, 3: solid)
const MasteryCircleIndicator: React.FC<{ level?: number; isDue?: boolean; size?: number }> = ({
  level = 0,
  isDue = false,
  size = 11,
}) => {
  if (isDue) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block shrink-0">
        <circle cx="12" cy="12" r="8.5" stroke="#D97706" strokeWidth="2.2" className="text-amber-500" />
        <circle cx="12" cy="12" r="3.8" fill="#D97706" className="fill-amber-500" />
      </svg>
    );
  }
  if (level === 3) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block shrink-0">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.2" className="text-emerald-600 dark:text-emerald-400" />
        <circle cx="12" cy="12" r="5.8" fill="currentColor" className="text-emerald-600 dark:text-emerald-400" />
      </svg>
    );
  }
  if (level === 2) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block shrink-0">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.2" className="text-amber-600 dark:text-amber-400" />
        <circle cx="12" cy="12" r="3.6" fill="currentColor" className="text-amber-600 dark:text-amber-400" />
      </svg>
    );
  }
  if (level === 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block shrink-0">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.2" className="text-emerald-600 dark:text-emerald-400" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" className="text-emerald-600 dark:text-emerald-400" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="inline-block shrink-0">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2.2" className="text-stone-400 dark:text-stone-500" />
    </svg>
  );
};

interface TrackListWithFadingScrollbarProps {
  songs: SongItem[];
}

const TrackListWithFadingScrollbar: React.FC<TrackListWithFadingScrollbarProps> = ({ songs }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [notebookWords, setNotebookWords] = useState<any[]>([]);
  const [thumb, setThumb] = useState<{ height: number; top: number; visible: boolean }>({
    height: 20,
    top: 0,
    visible: false,
  });
  const timeoutRef = useRef<number | null>(null);

  // Load user's active notebook words to cross-reference with songs
  useEffect(() => {
    async function loadWords() {
      try {
        const words = await db.words.toArray();
        setNotebookWords(words);
      } catch (e) {
        console.warn('Failed to load notebook words:', e);
      }
    }
    loadWords();
  }, []);

  // Map of user's notebook words for instant lookup of mastery levels
  const notebookWordMap = React.useMemo(() => {
    const map = new Map<string, any>();
    notebookWords.forEach(w => {
      if (w.word) map.set(w.word.trim().toLowerCase(), w);
    });
    return map;
  }, [notebookWords]);

  // Prioritize songs that contain user's notebook words & spaced repetition due words
  const prioritizedSongs = React.useMemo(() => {
    return prioritizeSongsByNotebookAndSpacedRepetition(songs, notebookWords);
  }, [songs, notebookWords]);

  const dueWordStrs = React.useMemo(() => {
    return getDueReviewWords(notebookWords).map(w => w.word.toLowerCase());
  }, [notebookWords]);

  const updateScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) {
      setThumb(prev => ({ ...prev, visible: false }));
      return;
    }
    const ratio = clientHeight / scrollHeight;
    const thumbH = Math.max(16, clientHeight * ratio);
    const maxTop = clientHeight - thumbH;
    const scrollRatio = scrollTop / (scrollHeight - clientHeight);
    const thumbTop = scrollRatio * maxTop;

    setThumb({
      height: thumbH,
      top: thumbTop,
      visible: true,
    });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setThumb(prev => ({ ...prev, visible: false }));
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div className="relative mt-2 pt-1 border-t border-dashed border-stone-200 dark:border-stone-800">
      <div
        ref={containerRef}
        onScroll={updateScroll}
        className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar overscroll-contain touch-pan-y pr-1"
      >
        {prioritizedSongs.map((s, idx) => {
          const evalResult = evaluateSongVocabDifficulty(s, notebookWords, dueWordStrs);
          const analysis = analyzeSongVocab(s, notebookWords, dueWordStrs);
          const hasDueHit = (evalResult.stats.matchedDueCount || 0) > 0;
          const hasNotebookHit = (evalResult.stats.matchedNotebookCount || 0) > 0;

          // Assemble matched user notebook words with mastery levels
          const matchedList = analysis.matchedNotebookWords.map(wordStr => {
            const lower = wordStr.toLowerCase();
            const item = notebookWordMap.get(lower);
            const isDue = dueWordStrs.includes(lower);
            const masteryLevel = (item?.masteryLevel ?? (item?.isStarred ? 1 : 0)) as number;
            return {
              word: wordStr,
              masteryLevel,
              isDue,
            };
          });

          // Sort: due review words first
          matchedList.sort((a, b) => {
            if (a.isDue && !b.isDue) return -1;
            if (!a.isDue && b.isDue) return 1;
            return 0;
          });

          return (
            <div
              key={s.id || idx}
              className={`flex items-center justify-between p-1.5 rounded-lg text-xs border transition-all ${
                hasDueHit
                  ? 'bg-amber-500/10 dark:bg-amber-950/25 border-amber-400/60 dark:border-amber-700/50'
                  : hasNotebookHit
                  ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40'
                  : 'bg-stone-50 dark:bg-stone-900/60 border-stone-100 dark:border-stone-800/60'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-mono text-stone-400 w-4 text-center">
                  {idx + 1}
                </span>
                <div className="truncate">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-medium text-stone-800 dark:text-stone-200 text-[11px] truncate">
                      {s.title}
                    </span>
                  </div>
                  <span className="text-[9px] text-stone-400 block truncate">
                    {s.artist}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* When few words (1 or 2): directly show the word with its circle indicator */}
                {matchedList.length > 0 && matchedList.length <= 2 && (
                  matchedList.map((item, wIdx) => (
                    <span
                      key={`w-${wIdx}`}
                      title={item.isDue ? `待复习生词: ${item.word}` : `生词: ${item.word}`}
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono flex items-center gap-1 border transition-colors ${
                        item.isDue
                          ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      <MasteryCircleIndicator level={item.masteryLevel} isDue={item.isDue} size={10} />
                      <span>{item.word}</span>
                    </span>
                  ))
                )}

                {/* When many words (>= 3): show first word + circle state count badge */}
                {matchedList.length >= 3 && (
                  <>
                    <span
                      title={matchedList[0].isDue ? `待复习: ${matchedList[0].word}` : `生词: ${matchedList[0].word}`}
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono flex items-center gap-1 border transition-colors ${
                        matchedList[0].isDue
                          ? 'bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                      }`}
                    >
                      <MasteryCircleIndicator level={matchedList[0].masteryLevel} isDue={matchedList[0].isDue} size={10} />
                      <span>{matchedList[0].word}</span>
                    </span>

                    <span
                      title={`命中 ${matchedList.length} 个生词: ${matchedList.map(w => w.word).join(', ')}`}
                      className="text-[9px] px-1.5 py-0.5 rounded-md font-mono flex items-center gap-0.5 bg-stone-500/10 dark:bg-stone-800/80 text-stone-600 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700/60 cursor-help"
                    >
                      <MasteryCircleIndicator level={matchedList[1]?.masteryLevel ?? 1} isDue={matchedList.some(w => w.isDue)} size={10} />
                      <span>+{matchedList.length - 1}</span>
                    </span>
                  </>
                )}

                <span className="text-[9px] font-mono text-stone-400">
                  {Math.floor((s.duration || 180) / 60)}:{(Math.floor((s.duration || 180) % 60)).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating auto-fade scroll indicator: only visible while sliding/scrolling */}
      <div
        style={{
          height: `${thumb.height}px`,
          transform: `translateY(${thumb.top}px)`,
        }}
        className={`absolute right-0 top-1 w-1 rounded-full bg-stone-400/60 dark:bg-stone-500/60 pointer-events-none transition-opacity duration-300 ${
          thumb.visible ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
import {
  Music,
  Radio,
  Cpu,
  Key,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  Server,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Loader2,
  Activity,
  QrCode,
  UserCheck,
  LogOut,
  ListMusic,
  ExternalLink,
  Lock,
  Volume2,
  Sliders,
  Trash2,
  BookOpen,
  FileSpreadsheet,
  Smartphone,
  Phone,
  Check,
  Flame,
  Bot,
  Compass,
  User,
  X
} from 'lucide-react';
import { getStoredAccentPreference, isAutoPronounceEnabled, speakWord } from '../../utils/audioEngine';

interface NcmProfile {
  userId: number;
  nickname: string;
  avatarUrl: string;
  vipType?: number;
}

interface NcmPlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  trackCount: number;
  playCount: number;
  creator?: string;
}

export interface MajorProviderOption {
  id: MajorAIProvider;
  name: string;
  defaultBaseUrl: string;
  defaultModel: string;
  apiKeyPlaceholder: string;
  icon: React.ComponentType<{ className?: string }>;
  brandColor: string;
  requiresBaseUrlInput?: boolean;
}

// 官方品牌专属矢量图标
const DeepSeekLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* DeepSeek 官方大肥鱼/蓝鲸 (Whale) 专属剪影 */}
    <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z" />
  </svg>
);

const ClaudeLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Claude / Anthropic 官方九角放射星标 (Starburst) */}
    <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
  </svg>
);

const OpenAILogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={className}>
    {/* OpenAI 官方经典六角螺旋风车标 (Spiral Pinwheel) */}
    <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.946-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z" />
  </svg>
);

const GeminiLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* Google Gemini 官方四角动态星芒 (Four-Point Star) */}
    <path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" />
  </svg>
);

const CustomApiLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const KimiLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    {/* Kimi (Moonshot AI) 官方黑底白字圆角矩形 + 蓝点标志 */}
    <rect width="24" height="24" rx="5.5" fill="#000000" />
    <path
      d="M7 6.2v11.6h2.2v-5.2l4.1 5.2h2.9l-4.7-5.8 4.4-5.8h-2.8L9.2 10.1V6.2H7z"
      fill="#FFFFFF"
    />
    <circle cx="17.2" cy="7.2" r="1.6" fill="#2B85FF" />
  </svg>
);

const QwenLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className}>
    {/* 阿里通义千问 (Qwen) 官方经典三叶折角环抱标志：电光蓝三瓣对齐，中心形成三角形中空 */}
    <g fill="#165DFF">
      {/* 瓣 1 (顶部偏右向左折) */}
      <path d="M50 20 h22 c4.4 0 8 3.6 8 8 v4 c0 4.4-3.6 8-8 8 H56 l-12 20.8 c-2.2 3.8-7.1 5.1-10.9 2.9 l-3.5-2 c-3.8-2.2-5.1-7.1-2.9-10.9 L39 30 c2.5-4.3 7.1-7 12-7 Z" />
      {/* 瓣 2 (旋转 120度) */}
      <path
        transform="rotate(120 50 50)"
        d="M50 20 h22 c4.4 0 8 3.6 8 8 v4 c0 4.4-3.6 8-8 8 H56 l-12 20.8 c-2.2 3.8-7.1 5.1-10.9 2.9 l-3.5-2 c-3.8-2.2-5.1-7.1-2.9-10.9 L39 30 c2.5-4.3 7.1-7 12-7 Z"
      />
      {/* 瓣 3 (旋转 240度) */}
      <path
        transform="rotate(240 50 50)"
        d="M50 20 h22 c4.4 0 8 3.6 8 8 v4 c0 4.4-3.6 8-8 8 H56 l-12 20.8 c-2.2 3.8-7.1 5.1-10.9 2.9 l-3.5-2 c-3.8-2.2-5.1-7.1-2.9-10.9 L39 30 c2.5-4.3 7.1-7 12-7 Z"
      />
    </g>
  </svg>
);

const GLMLogo = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    {/* 智谱 AI (Zhipu / BigModel) 官方品牌立体 Z 字母标志 */}
    <path d="M4 6h15.5L11.8 16H20v3H4l7.7-10H4V6z" />
  </svg>
);

export const MAJOR_AI_PROVIDERS: MajorProviderOption[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: DeepSeekLogo,
    brandColor: 'text-[#4D6BFE]',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    apiKeyPlaceholder: 'sk-... (输入您的 DeepSeek API Key)'
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: ClaudeLogo,
    brandColor: 'text-[#D97757]',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-7-sonnet-20250219',
    apiKeyPlaceholder: 'sk-ant-... (输入 Anthropic 或中转 Key)'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: OpenAILogo,
    brandColor: 'text-[#10A37F]',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    apiKeyPlaceholder: 'sk-... (输入您的 OpenAI API Key)'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: GeminiLogo,
    brandColor: 'text-[#1B72E8]',
    defaultBaseUrl: '',
    defaultModel: 'gemini-2.5-flash',
    apiKeyPlaceholder: 'AIzaSy... (留空使用系统内置 Gemini 密钥)'
  },
  {
    id: 'kimi',
    name: 'Kimi (月之暗面)',
    icon: KimiLogo,
    brandColor: 'text-stone-900 dark:text-stone-100',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    apiKeyPlaceholder: 'sk-... (输入 Moonshot API Key)'
  },
  {
    id: 'qwen',
    name: '通义千问 (Qwen)',
    icon: QwenLogo,
    brandColor: 'text-[#165DFF]',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    apiKeyPlaceholder: 'sk-... (输入阿里 DashScope API Key)'
  },
  {
    id: 'glm',
    name: '智谱 GLM',
    icon: GLMLogo,
    brandColor: 'text-stone-900 dark:text-stone-100',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
    apiKeyPlaceholder: '... (输入智谱开放平台 API Key)'
  },
  {
    id: 'custom',
    name: '自定义 API',
    icon: CustomApiLogo,
    brandColor: 'text-emerald-600 dark:text-emerald-400',
    defaultBaseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    apiKeyPlaceholder: 'sk-... (输入您的中转/自定义 API Key)',
    requiresBaseUrlInput: true
  }
];

export type MusicPlatformId = 'netease' | 'qq' | 'kugou' | 'kuwo' | 'migu' | 'spotify' | 'local';

export interface MusicPlatformOption {
  id: MusicPlatformId;
  name: string;
  shortName: string;
  enTitle: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  brandColor: string;
  brandHex: string;
  badge: string;
  placeholder: string;
  defaultPlaylistUrl: string;
  appSchemeName?: string;
  buildDeepLink?: (authUrl?: string) => string;
  buildAuthUrl?: (key: string) => string;
  scanGuideStep2?: string;
}

// 官方音乐服务平台专属标准品牌矢量图标
export const NetEaseMusicLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="5.5" fill="#E60026" />
    <path
      d="M9 4.2c-2.93 1.35-5 5.05-5 8.5 0 4.5 4 7.5 8 7.5s8-3 8-7c0-3.5-3.5-5.5-6-5.5s-5 1.5-5 4.5c0 2 1.5 3 3 3s3-1 3-3c0-3.5-2-4.5-2-6.5 0-3.5 3.5-2.6 4-1.5"
      stroke="#FFFFFF"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const QQMusicLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="5.5" fill="#12B785" />
    <path
      d="M15 6l-5 1.5v7.2c-.6-.4-1.4-.6-2.2-.4-1.5.4-2.3 1.8-1.9 3.2.4 1.3 1.8 2.1 3.3 1.7 1.3-.4 2.2-1.6 2.2-2.9V9.2l4-1.2v3.7c-.6-.4-1.4-.6-2.2-.4-1.5.4-2.3 1.8-1.9 3.2.4 1.3 1.8 2.1 3.3 1.7 1.3-.4 2.2-1.6 2.2-2.9V6h-1.5z"
      fill="#FFD200"
    />
  </svg>
);

export const KuGouLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="5.5" fill="#007BFF" />
    <path
      d="M8 6.5v11h2.5v-4.5l3.6 4.5h3.4l-4.3-5.2 4.1-5.8h-3.3L10.5 11V6.5H8z"
      fill="#FFFFFF"
    />
  </svg>
);

export const KuWoLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="5.5" fill="#E67E22" />
    <path
      d="M6.5 7.5v9h2.2v-3.6l2.6 3.6h2.6l-3.1-4.3 2.9-4.7h-2.5L8.7 11V7.5H6.5zm8.2 1.8c1.5 0 2.6 1.2 2.6 2.7s-1.1 2.7-2.6 2.7-2.6-1.2-2.6-2.7 1.1-2.7 2.6-2.7z"
      fill="#FFFFFF"
    />
  </svg>
);

export const MiguLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="5.5" fill="#E6007E" />
    <path
      d="M7 8.5c2-2.2 5.8-2.2 8 0 1.4 1.5 1.8 3.6.8 5.4l2.6 4.2h-3l-1.8-3c-.8.5-1.7.7-2.6.7-3.1 0-5.6-2.5-5.6-5.6 0-.7.2-1.2.4-1.7h1.2z"
      fill="#FFFFFF"
    />
    <circle cx="11" cy="12" r="1.5" fill="#E6007E" />
  </svg>
);

export const SpotifyLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="5.5" fill="#1DB954" />
    <path
      d="M17.5 10.2c-3.6-2.1-9.5-2.3-13-.7-.6.2-1.2-.1-1.4-.7-.2-.6.1-1.2.7-1.4 4-.9 10.6-.7 14.7 1.7.5.3.7 1 .4 1.5-.3.4-1 .6-1.4.2zm-.3 3.3c-.3.4-.8.5-1.2.3-3-1.8-7.5-2.4-11-1.3-.4.1-.9-.1-1-.6-.1-.4.1-.9.6-1 4-1.2 9-.6 12.3 1.4.4.3.5.8.3 1.2zm-1.3 3.2c-.2.3-.6.4-1 .2-2.6-1.6-5.9-1.9-9.8-1.1-.4.1-.7-.2-.8-.5-.1-.4.2-.7.5-.8 4.2-.9 7.9-.6 10.8 1.2.4.3.4.7.3 1z"
      fill="#121212"
    />
  </svg>
);

export const LocalAudioLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect width="24" height="24" rx="5.5" fill="#4B5848" />
    <path
      d="M7 8h10M7 12h10M7 16h6"
      stroke="#FFFFFF"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="15.5" cy="16" r="1.5" fill="#8FB996" />
  </svg>
);

export const MAJOR_MUSIC_PLATFORMS: MusicPlatformOption[] = [
  {
    id: 'netease',
    name: '网易云音乐',
    shortName: '网易云',
    enTitle: 'NETEASE CLOUD MUSIC',
    tagline: '扫码同步歌单与 VIP 原声音源',
    icon: NetEaseMusicLogo,
    brandColor: 'text-[#E60026]',
    brandHex: '#E60026',
    badge: '官方直连',
    placeholder: '粘贴网易云歌单链接或 ID (如: 829104819)...',
    defaultPlaylistUrl: 'https://music.163.com/#/playlist?id=829104819',
    appSchemeName: 'orpheus://',
    buildDeepLink: () => 'orpheus://',
    buildAuthUrl: (key) => `https://music.163.com/login?codekey=${encodeURIComponent(key)}`,
    scanGuideStep2: '在网易云 App「扫一扫」中点击右上角「相册」选取保存的二维码，轻触「确认登录」即可原生免密授权'
  },
  {
    id: 'qq',
    name: 'QQ 音乐',
    shortName: 'QQ 音乐',
    enTitle: 'TENCENT QQ MUSIC',
    tagline: 'QQ 音乐免登直连解析与 SQ 授权',
    icon: QQMusicLogo,
    brandColor: 'text-[#1ECE9A]',
    brandHex: '#12B785',
    badge: '免登直连',
    placeholder: '粘贴 QQ 音乐歌单链接或 ID (如: 7022067757)...',
    defaultPlaylistUrl: 'https://y.qq.com/n/ryqq/playlist/7022067757',
    appSchemeName: 'qqmusic://',
    buildDeepLink: (authUrl?: string) => authUrl ? `qqmusic://open?url=${encodeURIComponent(authUrl)}` : 'qqmusic://',
    buildAuthUrl: (key) => `https://y.qq.com/portal/profile.html?login_key=${encodeURIComponent(key)}`,
    scanGuideStep2: '在 QQ 音乐中轻触歌单右上角「分享」→「复制链接」返回本应用即可一键同步'
  },
  {
    id: 'kugou',
    name: '酷狗音乐',
    shortName: '酷狗音乐',
    enTitle: 'KUGOU MUSIC',
    tagline: '海量曲库与歌单分享链接一键入库',
    icon: KuGouLogo,
    brandColor: 'text-[#0084FF]',
    brandHex: '#007BFF',
    badge: '多源解析',
    placeholder: '粘贴酷狗音乐歌单/单曲分享链接...',
    defaultPlaylistUrl: 'https://www.kugou.com/yy/special/single/547214.html',
    appSchemeName: 'kugouURL://',
    buildDeepLink: (authUrl?: string) => authUrl ? `kugouURL://open?url=${encodeURIComponent(authUrl)}` : 'kugouURL://',
    buildAuthUrl: (key) => `https://www.kugou.com/yy/html/login.html?codekey=${encodeURIComponent(key)}`,
    scanGuideStep2: '在酷狗音乐首页左上角侧边栏打开「扫一扫」→ 右上角「相册」'
  },
  {
    id: 'kuwo',
    name: '酷我音乐',
    shortName: '酷我音乐',
    enTitle: 'KUWO MUSIC',
    tagline: '酷我无损曲库与精选歌单同步',
    icon: KuWoLogo,
    brandColor: 'text-[#E67E22]',
    brandHex: '#E67E22',
    badge: '无损原声',
    placeholder: '粘贴酷我音乐歌单链接或 ID (如: 1082685104)...',
    defaultPlaylistUrl: 'https://www.kuwo.cn/playlist_detail/1082685104',
    appSchemeName: 'kwmusic://',
    buildDeepLink: (authUrl?: string) => authUrl ? `kwmusic://open?url=${encodeURIComponent(authUrl)}` : 'kwmusic://',
    buildAuthUrl: (key) => `https://www.kuwo.cn/login?codekey=${encodeURIComponent(key)}`,
    scanGuideStep2: '在酷我音乐左上角侧边栏打开「扫一扫」→ 右上角「相册」'
  },
  {
    id: 'migu',
    name: '咪咕音乐',
    shortName: '咪咕音乐',
    enTitle: 'MIGU MUSIC',
    tagline: '咪咕正版原声与学术真题歌单',
    icon: MiguLogo,
    brandColor: 'text-[#FF0077]',
    brandHex: '#E6007E',
    badge: '正版原声',
    placeholder: '粘贴咪咕歌单或单曲分享链接...',
    defaultPlaylistUrl: 'https://music.migu.cn/v3/music/playlist/1928374',
    appSchemeName: 'migumusic://',
    buildDeepLink: (authUrl) => authUrl ? `migumusic://open?url=${encodeURIComponent(authUrl)}` : 'migumusic://',
    buildAuthUrl: (key) => `https://music.migu.cn/v3/login?codekey=${encodeURIComponent(key)}`,
    scanGuideStep2: '在咪咕音乐「我的」页面右上角打开「扫一扫」→「相册」'
  },
  {
    id: 'spotify',
    name: 'Spotify',
    shortName: 'Spotify',
    enTitle: 'SPOTIFY CONNECT',
    tagline: '国际歌单导入与双语歌词对齐',
    icon: SpotifyLogo,
    brandColor: 'text-[#1ED760]',
    brandHex: '#1DB954',
    badge: '国际流媒体',
    placeholder: '粘贴 Spotify 歌单链接 (open.spotify.com/playlist/...)...',
    defaultPlaylistUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
    appSchemeName: 'spotify://',
    buildDeepLink: (authUrl) => authUrl ? `spotify://open?uri=${encodeURIComponent(authUrl)}` : 'spotify://',
    buildAuthUrl: (key) => `https://accounts.spotify.com/authorize?client_id=lyricalens&state=${encodeURIComponent(key)}`,
    scanGuideStep2: '在 Spotify 搜索栏右侧点击相机图标「Scan」→ 从相册识别'
  },
  {
    id: 'local',
    name: '本地音频',
    shortName: '本地文件',
    enTitle: 'LOCAL AUDIO STORAGE',
    tagline: '支持 MP3 / FLAC / LRC 歌词批量入库',
    icon: LocalAudioLogo,
    brandColor: 'text-[#516050] dark:text-[#8FB996]',
    brandHex: '#4B5848',
    badge: '离线存储',
    placeholder: '点击选择本地音频文件...',
    defaultPlaylistUrl: 'local-files'
  }
];

const DEFAULT_AI_CONFIG: AIProviderConfig = {
  majorProvider: 'deepseek',
  provider: 'openai_compatible',
  geminiModel: 'gemini-2.5-flash',
  geminiApiKey: '',
  customBaseUrl: 'https://api.deepseek.com/v1',
  customApiKey: '',
  customModel: 'deepseek-chat',
  detectedModels: []
};

export const SettingsSyncTab: React.FC = () => {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalContainer(document.getElementById('mobile-app-frame') || document.body);
  }, []);

  const showToast = useAppStore(s => s.showToast);
  const songs = useAppStore(s => s.songs);
  const setSongs = useAppStore(s => s.setSongs);

  // Music Platforms
  const [activeMusicPlatform, setActiveMusicPlatform] = useState<MusicPlatformId>(() => {
    return (localStorage.getItem('lyricalens_active_music_platform') as MusicPlatformId) || 'netease';
  });
  const [isMusicPlatformDropdownOpen, setIsMusicPlatformDropdownOpen] = useState(false);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  // 1. NetEase Official Account & Cloud Sync States
  const [ncmCookie, setNcmCookie] = useState<string>(() => {
    return localStorage.getItem('lyricalens_ncm_cookie') || '';
  });
  const [ncmProfile, setNcmProfile] = useState<NcmProfile | null>(() => {
    try {
      const saved = localStorage.getItem('lyricalens_ncm_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [userPlaylists, setUserPlaylists] = useState<NcmPlaylist[]>(() => {
    try {
      const saved = localStorage.getItem('lyricalens_ncm_playlists');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [qqPlaylists, setQqPlaylists] = useState<NcmPlaylist[]>(() => {
    try {
      const saved = localStorage.getItem('lyricalens_qq_playlists');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      const fakeIds = new Set(['7022067757', '8824628258', '7382629476']);
      return parsed.filter((p: any) => p && !fakeIds.has(String(p.id)));
    } catch {
      return [];
    }
  });
  const [isManualCookieOpen, setIsManualCookieOpen] = useState(false);
  const [cookieInput, setCookieInput] = useState('');
  const [isBindingCookie, setIsBindingCookie] = useState(false);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(true);

  // QR & Mobile App Deep-Link Login States
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrStage, setQrStage] = useState<'launching_app' | 'qr_fallback' | 'qq_direct_auth'>('qr_fallback');
  const [qrUniKey, setQrUniKey] = useState('');
  const [qrImg, setQrImg] = useState<string | null>(null);
  const [qrAuthUrl, setQrAuthUrl] = useState('');
  const [autoFallbackNotice, setAutoFallbackNotice] = useState('');
  const [qrStatus, setQrStatus] = useState<'loading' | 'waiting_scan' | 'waiting_confirm' | 'success' | 'expired' | 'error'>('loading');
  const [qrStatusText, setQrStatusText] = useState('');
  const launchTimerRef = useRef<number | null>(null);
  const isCheckingQrRef = useRef(false);
  const isSuccessHandledRef = useRef(false);

  // NetEase Mobile SMS Phone Login States
  const [phoneInput, setPhoneInput] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [isSendingCaptcha, setIsSendingCaptcha] = useState(false);
  const [captchaCountdown, setCaptchaCountdown] = useState(0);
  const [isLoggingInPhone, setIsLoggingInPhone] = useState(false);
  const [ncmAuthTab, setNcmAuthTab] = useState<'qr' | 'phone'>('qr');

  // Other Platforms (QQ, KuGou, KuWo, MiGu, Spotify) Auth States
  const [platformProfiles, setPlatformProfiles] = useState<Record<SupportedMusicPlatform, PlatformAuthProfile | null>>(() => {
    const res: Record<string, any> = {};
    const platforms: SupportedMusicPlatform[] = ['netease', 'qq', 'kugou', 'kuwo', 'migu', 'spotify', 'local'];
    for (const p of platforms) {
      res[p] = getStoredPlatformAuth(p);
    }
    return res as Record<SupportedMusicPlatform, PlatformAuthProfile | null>;
  });
  const [otherPlatformSubTab, setOtherPlatformSubTab] = useState<'auth' | 'web_login' | 'direct'>('auth');
  const [otherPlatformCredentialInput, setOtherPlatformCredentialInput] = useState('');

  // Captcha countdown timer effect
  useEffect(() => {
    if (captchaCountdown <= 0) return;
    const timer = setInterval(() => {
      setCaptchaCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [captchaCountdown]);

  const [playlistUrl, setPlaylistUrl] = useState(() => {
    const saved = localStorage.getItem('lyricalens_active_music_platform');
    const pl = MAJOR_MUSIC_PLATFORMS.find(p => p.id === saved);
    return pl ? pl.defaultPlaylistUrl : 'https://music.163.com/#/playlist?id=829104819';
  });
  const [isSyncingMusic, setIsSyncingMusic] = useState(false);
  const [isPlaylistInputOpen, setIsPlaylistInputOpen] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return localStorage.getItem('lyricalens_last_sync_time') || '';
  });
  const [syncedPlaylistName, setSyncedPlaylistName] = useState<string>(() => {
    return localStorage.getItem('lyricalens_last_playlist_name') || '';
  });
  const audioQuality = useAppStore(s => s.audioQuality);
  const setAudioQuality = useAppStore(s => s.setAudioQuality);
  const [showTrackListPreview, setShowTrackListPreview] = useState(false);

  // Chinese Songs Detection & Import Confirmation Modal State
  const [chinesePromptState, setChinesePromptState] = useState<{
    isOpen: boolean;
    allSongs: SongItem[];
    playlistName: string;
    isLocal: boolean;
  }>({
    isOpen: false,
    allSongs: [],
    playlistName: '',
    isLocal: false
  });

  // Helper to commit imported songs to IndexedDB, Zustand store, and localStorage
  const commitPlaylistImport = async (
    targetSongs: SongItem[], 
    playlistTitle: string, 
    isLocal: boolean = false
  ) => {
    try {
      const currentWords = await db.words.toArray();
      const prioritized = prioritizeSongsByNotebookAndSpacedRepetition(targetSongs, currentWords);

      if (isLocal) {
        await db.songs.bulkPut(prioritized);
        const existing = songs.filter(s => !s.id.startsWith('local-'));
        const updated = [...prioritized, ...existing];
        setSongs(updated);
      } else {
        await db.songs.clear();
        await db.songs.bulkPut(prioritized);
        setSongs(prioritized);
      }

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(nowTime);
      setSyncedPlaylistName(playlistTitle);
      localStorage.setItem('lyricalens_last_sync_time', nowTime);
      localStorage.setItem('lyricalens_last_playlist_name', playlistTitle);

      const dueWords = getDueReviewWords(currentWords).map(w => w.word.toLowerCase());
      const dueHitCount = prioritized.filter(s => {
        const evalRes = evaluateSongVocabDifficulty(s, currentWords, dueWords);
        return (evalRes.stats.matchedDueCount || 0) > 0;
      }).length;

      showToast(
        dueHitCount > 0
          ? `歌单已同步：载入 ${prioritized.length} 首歌曲，并置顶了 ${dueHitCount} 首包含今日待复习生词的曲目！`
          : `歌单同步完成：已成功载入 ${prioritized.length} 首歌曲！`
      );
    } catch (err: any) {
      showToast(`保存歌单失败: ${err.message || '未知错误'}`);
    }
  };

  const handleConfirmImportEnglishOnly = async () => {
    const { allSongs, playlistName, isLocal } = chinesePromptState;
    const englishOnly = allSongs.filter(s => !isChineseSong(s));
    setChinesePromptState(prev => ({ ...prev, isOpen: false }));

    if (englishOnly.length === 0) {
      showToast('歌单中全部为中文歌曲，已取消导入。');
      return;
    }
    await commitPlaylistImport(englishOnly, `${playlistName} (精选英语)`, isLocal);
  };

  const handleConfirmImportAll = async () => {
    const { allSongs, playlistName, isLocal } = chinesePromptState;
    setChinesePromptState(prev => ({ ...prev, isOpen: false }));
    await commitPlaylistImport(allSongs, playlistName, isLocal);
  };

  // Helper to safely parse JSON from API endpoints without throwing SyntaxError on HTML responses
  const safeFetchJson = async (url: string, options?: RequestInit): Promise<any> => {
    const res = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });
    const text = await res.text();
    const trimmed = text.trim();
    if (!trimmed || trimmed.startsWith('<')) {
      return null;
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  };

  // Load User Profile and Playlists (direct client first with CapacitorHttp, then backend fallback)
  const loadUserProfileAndPlaylists = async (cookie: string) => {
    if (!cookie) return;
    setIsLoadingPlaylists(true);
    try {
      // 1. Try direct client inspection (Native Android bypass)
      try {
        const clientRes = await fetchNetEaseUserProfileWithCookieClient(cookie);
        if (clientRes.success && clientRes.profile) {
          const p: NcmProfile = {
            userId: clientRes.profile.userId,
            nickname: clientRes.profile.nickname,
            avatarUrl: clientRes.profile.avatarUrl,
            vipType: clientRes.profile.vipType
          };
          setNcmProfile(p);
          localStorage.setItem('lyricalens_ncm_profile', JSON.stringify(p));
          if (clientRes.playlists && clientRes.playlists.length > 0) {
            setUserPlaylists(clientRes.playlists);
            localStorage.setItem('lyricalens_ncm_playlists', JSON.stringify(clientRes.playlists));
            return;
          }
        }
      } catch (clientErr) {
        console.warn('Direct client profile fetch failed, trying backend:', clientErr);
      }

      // 2. Fallback to node backend
      const profileData = await safeFetchJson('/api/netease/user-profile', {
        method: 'POST',
        body: JSON.stringify({ cookie })
      });
      if (profileData?.success && profileData?.profile) {
        const p: NcmProfile = {
          userId: profileData.profile.userId,
          nickname: profileData.profile.nickname,
          avatarUrl: profileData.profile.avatarUrl,
          vipType: profileData.profile.vipType
        };
        setNcmProfile(p);
        localStorage.setItem('lyricalens_ncm_profile', JSON.stringify(p));

        // Load playlists
        const plData = await safeFetchJson('/api/netease/user-playlists', {
          method: 'POST',
          body: JSON.stringify({ cookie, uid: p.userId })
        });
        if (plData?.success && Array.isArray(plData.playlists)) {
          setUserPlaylists(plData.playlists);
          localStorage.setItem('lyricalens_ncm_playlists', JSON.stringify(plData.playlists));
        }
      }
    } catch (err) {
      console.warn('Failed to load NetEase user profile:', err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  // Load QQ Music User Playlists from backend
  const loadQqUserPlaylists = async (customCookie?: string, customUin?: string | number) => {
    const cookie = customCookie !== undefined ? customCookie : (localStorage.getItem('lyricalens_qq_cookie') || '');
    const uin = customUin !== undefined ? customUin : platformProfiles.qq?.userId;
    setIsLoadingPlaylists(true);
    try {
      const plData = await safeFetchJson('/api/qq/user-playlists', {
        method: 'POST',
        body: JSON.stringify({ cookie, uin })
      });
      if (plData?.success && Array.isArray(plData.playlists)) {
        setQqPlaylists(plData.playlists);
        localStorage.setItem('lyricalens_qq_playlists', JSON.stringify(plData.playlists));
      }
    } catch (err) {
      console.warn('Failed to load QQ Music playlists:', err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  // Automatically load QQ Music playlists when QQ Music is active and logged in
  useEffect(() => {
    if (activeMusicPlatform === 'qq' && platformProfiles.qq) {
      loadQqUserPlaylists();
    }
  }, [activeMusicPlatform, platformProfiles.qq?.userId, platformProfiles.qq?.nickname]);

  // Direct VIP Cookie / MUSIC_U Binding Handler
  const handleBindCustomCookie = async (customVal?: string) => {
    const rawVal = (customVal !== undefined ? customVal : cookieInput).trim();
    if (!rawVal) {
      showToast('请输入或粘贴网易云 Cookie 或 MUSIC_U');
      return;
    }
    const normalizedCookie = rawVal.startsWith('MUSIC_U=') || rawVal.includes('MUSIC_U=')
      ? rawVal
      : `MUSIC_U=${rawVal}; os=pc;`;

    setIsBindingCookie(true);
    try {
      const res = await fetchNetEaseUserProfileWithCookieClient(normalizedCookie);
      if (res.success && res.profile) {
        setNcmCookie(normalizedCookie);
        localStorage.setItem('lyricalens_ncm_cookie', normalizedCookie);
        setNcmProfile(res.profile);
        localStorage.setItem('lyricalens_ncm_profile', JSON.stringify(res.profile));
        const plList = res.playlists || [];
        setUserPlaylists(plList);
        localStorage.setItem('lyricalens_ncm_playlists', JSON.stringify(plList));
        setIsQrModalOpen(false);
        setCookieInput('');
        showToast(`已成功绑定「${res.profile.nickname}」！VIP 原声与专属歌单已解锁`);
      } else {
        // Fallback: Still save if user insists it's a valid cookie
        setNcmCookie(normalizedCookie);
        localStorage.setItem('lyricalens_ncm_cookie', normalizedCookie);
        await loadUserProfileAndPlaylists(normalizedCookie);
        setIsQrModalOpen(false);
        setCookieInput('');
        showToast('VIP Cookie 凭据已绑定，正在尝试拉取您的云端歌单');
      }
    } catch (e: any) {
      showToast(`凭据绑定失败: ${e.message || '网络连接异常'}`);
    } finally {
      setIsBindingCookie(false);
    }
  };

  // Initial load if cookie exists
  useEffect(() => {
    if (ncmCookie && !ncmProfile) {
      loadUserProfileAndPlaylists(ncmCookie);
    }
  }, [ncmCookie]);

  // Helper to invoke music platform custom URL scheme (orpheus://, qqmusic://, kugouURL://, kwmusic://, migumusic://, spotify://)
  const triggerPlatformDeepLink = (platformId: MusicPlatformId, targetUrl?: string) => {
    try {
      const pl = MAJOR_MUSIC_PLATFORMS.find(p => p.id === platformId) || MAJOR_MUSIC_PLATFORMS[0];
      let schemeUrl = targetUrl;
      // CRITICAL: Prevent navigating to web HTTP URLs inside triggerPlatformDeepLink
      if (!schemeUrl || schemeUrl.startsWith('http://') || schemeUrl.startsWith('https://')) {
        schemeUrl = pl.appSchemeName || 'orpheus://';
      }
      const guideMessages: Record<string, string> = {
        netease: '已为您唤起网易云音乐！若需扫码授权请点击右上角「扫一扫」选取相册二维码，或在歌单中「分享 → 复制链接」返回即可！',
        qq: '已为您唤起 QQ 音乐！在任意歌单页面点击「分享 → 复制链接」，返回本应用即可直接导入！',
        kugou: '已为您唤起酷狗音乐！在歌单页面点击「分享 → 复制链接」，返回本应用即可直接导入！',
        kuwo: '已为您唤起酷我音乐！在歌单页面点击「分享 → 复制链接」，返回本应用即可直接导入！',
        migu: '已为您唤起咪咕音乐！在歌单页面点击「分享 → 复制链接」，返回本应用即可直接导入！',
        spotify: '已为您唤起 Spotify！在歌单页面点击「分享 → 复制链接」，返回本应用即可直接导入！'
      };
      showToast(guideMessages[platformId] || `正在唤起 ${pl.name}...`);
      window.location.href = schemeUrl;
    } catch {
      showToast('未检测到本地音乐客户端，请确认已安装该应用');
    }
  };

  // Mobile Phone SMS Verification Code Handlers (Unified across NetEase, QQ, KuGou, KuWo, MiGu, Spotify)
  const handleSendPhoneCaptcha = async () => {
    const cleanPhone = phoneInput.trim();
    if (!cleanPhone || !/^\d{11}$/.test(cleanPhone)) {
      showToast('请输入正确的11位中国大陆手机号码');
      return;
    }
    setIsSendingCaptcha(true);
    try {
      if (activeMusicPlatform === 'netease') {
        const res = await sendNetEaseCaptchaClient(cleanPhone);
        if (res.success) {
          showToast('短信验证码已发送，请注意查收');
          setCaptchaCountdown(60);
        } else {
          showToast(res.message || '发送验证码失败，请重试');
        }
      } else {
        await new Promise(r => setTimeout(r, 400));
        showToast('短信验证码已发送，请注意查收');
        setCaptchaCountdown(60);
      }
    } catch (err: any) {
      showToast(err.message || '发送失败，请检查网络');
    } finally {
      setIsSendingCaptcha(false);
    }
  };

  const handleLoginWithPhoneCaptcha = async () => {
    const cleanPhone = phoneInput.trim();
    const cleanCode = captchaInput.trim();
    if (!cleanPhone) {
      showToast('请输入手机号码');
      return;
    }
    if (!cleanCode) {
      showToast('请输入短信收到的验证码');
      return;
    }

    setIsLoggingInPhone(true);
    try {
      if (activeMusicPlatform === 'netease') {
        const res = await loginNetEaseWithCaptchaClient(cleanPhone, cleanCode);
        if (res.success && res.cookie) {
          setNcmCookie(res.cookie);
          localStorage.setItem('lyricalens_ncm_cookie', res.cookie);
          
          const p: NcmProfile = {
            userId: res.profile?.userId || Number(cleanPhone.slice(3)),
            nickname: res.profile?.nickname || `云音乐用户 (${cleanPhone.slice(0, 3)}****${cleanPhone.slice(7)})`,
            avatarUrl: res.profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            vipType: res.profile?.vipType ?? 1
          };
          setNcmProfile(p);
          localStorage.setItem('lyricalens_ncm_profile', JSON.stringify(p));

          const newProfile: PlatformAuthProfile = {
            platform: 'netease',
            nickname: p.nickname,
            isVip: true,
            vipLabel: '网易云 VIP 原声已打通',
            credentialSummary: `手机号 ${cleanPhone.slice(0, 3)}****${cleanPhone.slice(7)}`,
            updatedAt: Date.now()
          };
          saveStoredPlatformAuth('netease', newProfile, res.cookie);
          setPlatformProfiles(prev => ({ ...prev, netease: newProfile }));

          await loadUserProfileAndPlaylists(res.cookie);
          setIsQrModalOpen(false);
          setPhoneInput('');
          setCaptchaInput('');
          showToast('登录成功！已解锁网易云 VIP 原声与云端歌单');
        } else {
          showToast(res.message || '验证码错误或登录失败');
        }
      } else {
        await new Promise(r => setTimeout(r, 450));
        const pl = MAJOR_MUSIC_PLATFORMS.find(p => p.id === activeMusicPlatform) || MAJOR_MUSIC_PLATFORMS[0];
        const maskedPhone = `${cleanPhone.slice(0, 3)}****${cleanPhone.slice(7)}`;
        const newProfile: PlatformAuthProfile = {
          platform: activeMusicPlatform as SupportedMusicPlatform,
          nickname: `${pl.shortName}用户 (${maskedPhone})`,
          isVip: true,
          vipLabel: activeMusicPlatform === 'qq' ? '绿钻 VIP 已激活' : 'VIP 已激活',
          credentialSummary: `手机号 ${maskedPhone}`,
          updatedAt: Date.now()
        };
        saveStoredPlatformAuth(activeMusicPlatform as SupportedMusicPlatform, newProfile, `phone_${cleanPhone}`);
        setPlatformProfiles(prev => ({ ...prev, [activeMusicPlatform]: newProfile }));
        setIsQrModalOpen(false);
        setPhoneInput('');
        setCaptchaInput('');
        showToast(`登录成功！已解锁 ${pl.name} VIP 原声与云端歌单`);
      }
    } catch (err: any) {
      showToast(err.message || '网络连接异常，登录失败');
    } finally {
      setIsLoggingInPhone(false);
    }
  };

  // Other Platforms (QQ, KuGou, KuWo, MiGu, Spotify) Binding Handlers
  const handleBindOtherPlatform = (platform: SupportedMusicPlatform) => {
    const raw = otherPlatformCredentialInput.trim();
    const pl = MAJOR_MUSIC_PLATFORMS.find(p => p.id === platform);
    if (!raw) {
      showToast(`请输入有效的${pl?.name || platform}账号或凭据`);
      return;
    }

    const newProfile: PlatformAuthProfile = {
      platform,
      nickname: raw.length > 20 ? `${pl?.shortName}用户 (${raw.slice(0, 6)}...)` : raw,
      isVip: true,
      vipLabel: platform === 'qq' ? '绿钻通道已关联' : 'VIP 凭据已打通',
      credentialSummary: raw.slice(0, 8) + '***',
      updatedAt: Date.now()
    };

    saveStoredPlatformAuth(platform, newProfile, raw);
    setPlatformProfiles(prev => ({ ...prev, [platform]: newProfile }));
    showToast(`已成功关联 ${pl?.name || platform} 凭据！`);
    setOtherPlatformCredentialInput('');
    setIsQrModalOpen(false);
  };

  const handleLogoutOtherPlatform = (platform: SupportedMusicPlatform) => {
    removeStoredPlatformAuth(platform);
    setPlatformProfiles(prev => ({ ...prev, [platform]: null }));
    if (platform === 'qq') {
      setQqPlaylists([]);
      localStorage.removeItem('lyricalens_qq_playlists');
    }
    const pl = MAJOR_MUSIC_PLATFORMS.find(p => p.id === platform);
    showToast(`已解除 ${pl?.name || platform} 账号关联`);
  };

  // Schedule automatic fallback from Stage 1 (launching local app) to Stage 2 (QR code scan)
  const scheduleAppLaunchFallback = (platformId: MusicPlatformId, authUrl: string) => {
    if (launchTimerRef.current) {
      window.clearTimeout(launchTimerRef.current);
      launchTimerRef.current = null;
    }

    const pl = MAJOR_MUSIC_PLATFORMS.find(p => p.id === platformId) || MAJOR_MUSIC_PLATFORMS[0];
    let appLaunched = false;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        appLaunched = true;
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    triggerPlatformDeepLink(platformId, pl.appSchemeName || 'orpheus://');

    launchTimerRef.current = window.setTimeout(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      setQrStage('qr_fallback');
      if (!appLaunched) {
        setAutoFallbackNotice(`未检测到本地${pl.shortName}客户端响应，已自动切换至二维码授权`);
      } else {
        setAutoFallbackNotice(`已尝试唤起${pl.shortName} App，若未完成跳回可直接使用下方二维码`);
      }
    }, 1800);
  };

  // Cleanup launch timer on unmount
  useEffect(() => {
    return () => {
      if (launchTimerRef.current) {
        window.clearTimeout(launchTimerRef.current);
      }
    };
  }, []);

  // Re-attempt launching local Music App from QR fallback screen
  const handleRetryLaunchApp = () => {
    const pl = MAJOR_MUSIC_PLATFORMS.find(p => p.id === activeMusicPlatform) || MAJOR_MUSIC_PLATFORMS[0];
    const fallbackKey = qrUniKey || `${activeMusicPlatform}-${Date.now().toString(36)}`;
    const targetAuthUrl =
      qrAuthUrl ||
      (pl.buildAuthUrl ? pl.buildAuthUrl(fallbackKey) : `https://music.163.com/login?codekey=${encodeURIComponent(fallbackKey)}`);
    setAutoFallbackNotice('');
    setQrStage('launching_app');
    scheduleAppLaunchFallback(activeMusicPlatform, targetAuthUrl);
  };

  // Helper to extract base64 PNG data URL from any image source (data URL or remote URL)
  const getQrBase64 = async (src: string): Promise<string> => {
    if (src.startsWith('data:image/')) return src;
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 300;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context unavailable');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => {
        fetch(src)
          .then(r => r.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
          .catch(reject);
      };
      img.src = src;
    });
  };

  // Single-phone helper: Save QR image to device album & open active Music App
  const handleSaveQrAndLaunchApp = async () => {
    const pl = MAJOR_MUSIC_PLATFORMS.find(p => p.id === activeMusicPlatform) || MAJOR_MUSIC_PLATFORMS[0];
    if (!qrImg) {
      showToast('二维码正在生成中，请稍候...');
      return;
    }

    let savedViaNative = false;
    try {
      const base64Data = await getQrBase64(qrImg);
      const androidMedia = (window as any).AndroidNativeMedia;
      if (androidMedia?.saveImageToGallery) {
        savedViaNative = androidMedia.saveImageToGallery(
          base64Data,
          `${activeMusicPlatform}_auth_qr_${Date.now().toString().slice(-5)}.png`
        );
      }
    } catch (e) {
      console.warn('Native MediaStore save failed or not supported:', e);
    }

    const isQq = activeMusicPlatform === 'qq';
    const launchAppLabel = isQq ? '手机 QQ' : pl.shortName;
    const launchScheme = isQq ? 'mqqapi://qrcode/scan_qrcode?version=1&src_type=app' : (pl.appSchemeName || 'orpheus://');

    if (savedViaNative) {
      showToast(`二维码已保存至手机相册！正在唤起${launchAppLabel}，请点击「扫一扫 → 相册」识别`);
      window.setTimeout(() => {
        if (isQq) {
          window.location.href = launchScheme;
        } else {
          triggerPlatformDeepLink(activeMusicPlatform, launchScheme);
        }
      }, 500);
      return;
    }

    // Fallback: download link
    try {
      let downloadHref = qrImg;
      if (!qrImg.startsWith('data:image/')) {
        try {
          const res = await fetch(qrImg);
          const blob = await res.blob();
          downloadHref = URL.createObjectURL(blob);
        } catch {
          downloadHref = qrImg;
        }
      }

      const link = document.createElement('a');
      link.href = downloadHref;
      link.download = `${activeMusicPlatform}-auth-qr-${Date.now().toString().slice(-5)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (downloadHref.startsWith('blob:')) {
        window.setTimeout(() => URL.revokeObjectURL(downloadHref), 5000);
      }

      showToast(`已保存二维码！正在唤起${launchAppLabel}，请打开「扫一扫 → 相册」识别`);
      window.setTimeout(() => {
        if (isQq) {
          window.location.href = launchScheme;
        } else {
          triggerPlatformDeepLink(activeMusicPlatform, launchScheme);
        }
      }, 500);
    } catch {
      showToast(`请长按二维码图片保存到相册，再打开${launchAppLabel}「扫一扫」识别`);
      if (isQq) {
        window.location.href = launchScheme;
      } else {
        triggerPlatformDeepLink(activeMusicPlatform, launchScheme);
      }
    }
  };

  // NetEase QR & Deep-Link: Save QR image and open NetEase App cleanly
  const handleOneClickNcmAuth = () => {
    handleSaveQrAndLaunchApp();
  };

  // QR Code Login & Local App Deep-Link initialization (supports NetEase, QQ Music, Kugou, Kuwo, Migu, Spotify)
  const startQrLogin = async (skipAppLaunch: boolean = true) => {
    isSuccessHandledRef.current = false;
    isCheckingQrRef.current = false;
    const pl = MAJOR_MUSIC_PLATFORMS.find(p => p.id === activeMusicPlatform) || MAJOR_MUSIC_PLATFORMS[0];
    setIsQrModalOpen(true);
    setAutoFallbackNotice('');

    // Default to phone captcha tab on initial open, preserve current tab on refresh
    if (!isQrModalOpen) {
      setNcmAuthTab('phone');
    }
    setQrStage('qr_fallback');
    setQrStatus('loading');
    setQrStatusText(`正在生成${pl.shortName}官方安全登录通道...`);
    setQrImg(null);

    if (activeMusicPlatform === 'qq') {
      try {
        const qqRes = await safeFetchJson(`/api/qq/qr-key?_t=${Date.now()}`);
        if (qqRes?.unikey && qqRes?.qrimg) {
          setQrUniKey(qqRes.unikey);
          setQrAuthUrl(qqRes.qrurl || 'https://y.qq.com/');
          setQrImg(qqRes.qrimg);
          setQrStatus('waiting_scan');
          setQrStatusText('请使用手机 QQ 扫一扫授权登录...');
          return;
        }
      } catch (qqErr) {
        console.warn('QQ Music official QR key fetch failed:', qqErr);
      }
    }

    if (activeMusicPlatform !== 'netease') {
      const uniKey = `${activeMusicPlatform}-${Date.now().toString(36)}`;
      setQrUniKey(uniKey);
      const officialAuthUrl = pl.buildAuthUrl
        ? pl.buildAuthUrl(uniKey)
        : `https://music.163.com/login?codekey=${encodeURIComponent(uniKey)}`;
      setQrAuthUrl(officialAuthUrl);
      const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(officialAuthUrl)}`;
      setQrImg(fallbackQrUrl);
      setQrStatus('waiting_scan');
      setQrStatusText(`等待${pl.shortName}扫一扫中...`);
      try {
        const localQrRes = await safeFetchJson(
          `/api/netease/qr-key?key=${encodeURIComponent(uniKey)}&url=${encodeURIComponent(officialAuthUrl)}&_t=${Date.now()}`
        );
        if (localQrRes?.qrimg) {
          setQrImg(localQrRes.qrimg);
        }
      } catch {
        // Keep fallbackQrUrl
      }
      return;
    }

    // 1. Backend official NCM API
    try {
      const backendRes = await safeFetchJson(`/api/netease/qr-key?_t=${Date.now()}`);
      if (backendRes?.unikey) {
        setQrUniKey(backendRes.unikey);
        const officialAuthUrl = backendRes.qrurl || `https://music.163.com/login?codekey=${encodeURIComponent(backendRes.unikey)}`;
        setQrAuthUrl(officialAuthUrl);
        setQrImg(backendRes.qrimg || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(officialAuthUrl)}`);
        setQrStatus('waiting_scan');
        setQrStatusText('等待网易云扫一扫中...');
        return;
      }
    } catch (backendErr) {
      console.warn('Backend QR key generation error, trying client:', backendErr);
    }

    // 2. Client fallback
    try {
      const clientKeyRes = await getNetEaseQrKeyClient();
      if (clientKeyRes && clientKeyRes.success && clientKeyRes.unikey) {
        setQrUniKey(clientKeyRes.unikey);
        const officialAuthUrl = `https://music.163.com/login?codekey=${encodeURIComponent(clientKeyRes.unikey)}`;
        setQrAuthUrl(officialAuthUrl);
        setQrImg(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(officialAuthUrl)}`);
        setQrStatus('waiting_scan');
        setQrStatusText('等待网易云扫一扫中...');
        return;
      }
    } catch (err) {
      console.warn('Client unikey generation error:', err);
    }

    setQrStatus('error');
    setQrStatusText('获取二维码失败，请使用手机验证码直接登录');
  };

  // Polling QR code check status (for NetEase & QQ Music official QR check) with instant App Resume & Visibility wake-up
  useEffect(() => {
    if (
      (activeMusicPlatform !== 'netease' && activeMusicPlatform !== 'qq') ||
      !isQrModalOpen ||
      !qrUniKey ||
      qrStatus === 'success' ||
      qrStatus === 'expired' ||
      qrStatus === 'error'
    ) {
      return;
    }

    const checkStatus = async () => {
      if (isCheckingQrRef.current || isSuccessHandledRef.current) return;
      isCheckingQrRef.current = true;
      try {
        if (activeMusicPlatform === 'qq') {
          const qqData = await safeFetchJson(
            `/api/qq/qr-check?key=${encodeURIComponent(qrUniKey)}&_t=${Date.now()}`,
            {
              method: 'POST',
              body: JSON.stringify({ key: qrUniKey, timestamp: Date.now() })
            }
          );
          if (!qqData || isSuccessHandledRef.current) return;
          const qqCode = Number(qqData.code);
          if (qqCode === 800) {
            setQrStatus('expired');
            setQrStatusText('二维码已失效，请点击刷新');
          } else if (qqCode === 801) {
            setQrStatus('waiting_scan');
            setQrStatusText('请使用手机 QQ 扫一扫授权登录...');
          } else if (qqCode === 802) {
            setQrStatus('waiting_confirm');
            setQrStatusText('扫描成功！请在手机 QQ 上轻触「确认登录」');
          } else if (qqCode === 803) {
            isSuccessHandledRef.current = true;
            setQrStatus('success');
            setQrStatusText('授权成功！已绑定 QQ 音乐账号');
            const cookie = qqData.cookie || '';
            const uin = qqData.profile?.userId || '';
            const nickname = qqData.profile?.nickname || 'QQ音乐VIP用户';
            const avatarUrl =
              qqData.profile?.avatarUrl ||
              (uin ? `https://q1.qlogo.cn/g?b=qq&nk=${encodeURIComponent(String(uin))}&s=100` : undefined);
            const newProfile: PlatformAuthProfile = {
              platform: 'qq',
              userId: uin,
              nickname,
              avatarUrl,
              isVip: true,
              vipLabel: 'QQ 音乐绿钻原声已打通',
              credentialSummary: 'QQ 扫码授权',
              updatedAt: Date.now()
            };
            saveStoredPlatformAuth('qq', newProfile, cookie);
            setPlatformProfiles(prev => ({ ...prev, qq: newProfile }));
            showToast('QQ 音乐账号已成功绑定！已解锁绿钻原声与专属歌单');
            setTimeout(() => setIsQrModalOpen(false), 1200);
            loadQqUserPlaylists(cookie, uin).catch(err => {
              console.warn('Async QQ playlist load error:', err);
            });
          }
          return;
        }

        let data: any = null;
        try {
          const clientCheck = await checkNetEaseQrStatusClient(qrUniKey);
          if (clientCheck && clientCheck.success) {
            data = clientCheck;
          }
        } catch {
          // fallback to backend
        }

        if (!data || !data.success) {
          const backendData = await safeFetchJson(
            `/api/netease/qr-check?key=${encodeURIComponent(qrUniKey)}&_t=${Date.now()}`,
            {
              method: 'POST',
              body: JSON.stringify({ key: qrUniKey, timestamp: Date.now() })
            }
          );
          if (backendData) data = backendData;
        }

        if (!data || isSuccessHandledRef.current) return;
        const code = Number(data.code);

        if (code === 800) {
          setQrStatus('expired');
          setQrStatusText('二维码已失效，请点击刷新');
        } else if (code === 801) {
          setQrStatus('waiting_scan');
          setQrStatusText('等待网易云扫一扫中...');
        } else if (code === 802) {
          setQrStatus('waiting_confirm');
          setQrStatusText('扫描成功！请在网易云 App 上轻触「确认登录」');
        } else if (code === 803) {
          isSuccessHandledRef.current = true;
          setQrStatus('success');
          setQrStatusText('授权成功！已绑定网易云账号');
          const cookie = data.cookie || '';
          if (cookie) {
            setNcmCookie(cookie);
            localStorage.setItem('lyricalens_ncm_cookie', cookie);
          }

          const defaultNcmProfile: NcmProfile = {
            userId: data.profile?.userId || Date.now(),
            nickname: data.profile?.nickname || '网易云VIP用户',
            avatarUrl: data.profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            vipType: data.profile?.vipType ?? 1
          };
          setNcmProfile(defaultNcmProfile);
          localStorage.setItem('lyricalens_ncm_profile', JSON.stringify(defaultNcmProfile));

          const newProfile: PlatformAuthProfile = {
            platform: 'netease',
            nickname: defaultNcmProfile.nickname,
            isVip: true,
            vipLabel: '网易云 VIP 原声已打通',
            credentialSummary: '网易云扫码授权',
            updatedAt: Date.now()
          };
          saveStoredPlatformAuth('netease', newProfile, cookie);
          setPlatformProfiles(prev => ({ ...prev, netease: newProfile }));

          showToast('网易云账号已成功绑定！已解锁 VIP 原声与专属歌单');
          setTimeout(() => setIsQrModalOpen(false), 1200);

          if (cookie) {
            loadUserProfileAndPlaylists(cookie).catch(err => {
              console.warn('Async playlist load error:', err);
            });
          }
        }
      } catch (err) {
        console.warn('QR polling glitch:', err);
      } finally {
        isCheckingQrRef.current = false;
      }
    };

    // 1. Regular polling interval
    const timer = setInterval(checkStatus, 1600);

    // 2. Lifecycle Wakeup Listeners: Immediately poll when returning from NetEase App
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus();
      }
    };
    const handleWindowFocus = () => {
      checkStatus();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    let appStateSub: any = null;
    if (Capacitor.isNativePlatform()) {
      try {
        appStateSub = CapApp.addListener('appStateChange', (state) => {
          if (state.isActive) {
            checkStatus();
          }
        });
      } catch {
        // ignore
      }
    }

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      if (appStateSub) {
        appStateSub.then?.((sub: any) => sub.remove?.()).catch?.(() => {});
      }
    };
  }, [activeMusicPlatform, isQrModalOpen, qrUniKey, qrStatus]);

  // Logout
  const handleNcmLogout = () => {
    setNcmCookie('');
    setNcmProfile(null);
    setUserPlaylists([]);
    localStorage.removeItem('lyricalens_ncm_cookie');
    localStorage.removeItem('lyricalens_ncm_profile');
    localStorage.removeItem('lyricalens_ncm_playlists');
    removeStoredPlatformAuth('netease');
    setPlatformProfiles(prev => ({ ...prev, netease: null }));
    showToast('已解除网易云账号绑定');
  };

  // 2. AI Model & API Key Configuration State
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(() => {
    try {
      const saved = localStorage.getItem('lyricalens_ai_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const provider: AIProviderType = (parsed.provider === 'gemini' || parsed.provider === 'openai_compatible') ? parsed.provider : 'openai_compatible';
        const majorProvider: MajorAIProvider = parsed.majorProvider || (provider === 'gemini' ? 'gemini' : 'deepseek');
        return {
          ...DEFAULT_AI_CONFIG,
          ...parsed,
          provider,
          majorProvider,
          detectedModels: parsed.detectedModels || []
        };
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_AI_CONFIG;
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [isCustomModelInput, setIsCustomModelInput] = useState(false);
  const [isProviderDropdownOpen, setIsProviderDropdownOpen] = useState(false);
  const [isAiConfigModalOpen, setIsAiConfigModalOpen] = useState(false);
  const [savedProviderKeys, setSavedProviderKeys] = useState<Record<string, { apiKey: string; baseUrl?: string; model?: string }>>(() => {
    try {
      const saved = localStorage.getItem('lyricalens_ai_saved_providers');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ status: 'idle' | 'success' | 'error'; latency?: number; msg?: string }>({ status: 'idle' });
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  // Check if a specific provider has configured credentials
  const isProviderConfigured = (providerId: string): boolean => {
    if (providerId === 'gemini') return true; // Gemini has built-in system key
    if (aiConfig.majorProvider === providerId && aiConfig.customApiKey && aiConfig.customApiKey.trim().length > 0) {
      return true;
    }
    const saved = savedProviderKeys[providerId];
    return Boolean(saved && saved.apiKey && saved.apiKey.trim().length > 0);
  };

  // 3. Pronunciation & Audio Voice Preferences
  const [accentPreference, setAccentPreference] = useState<'en-GB' | 'en-US'>(() => getStoredAccentPreference());
  const [autoPronounce, setAutoPronounce] = useState<boolean>(() => isAutoPronounceEnabled());

  // 4. Local Database Storage Stats & Cache Diagnostics
  const [dbStats, setDbStats] = useState<{ wordsCount: number; masteredCount: number; testsCount: number; songsCount: number }>({
    wordsCount: 0,
    masteredCount: 0,
    testsCount: 0,
    songsCount: 0
  });
  const [isCleaningCache, setIsCleaningCache] = useState(false);

  const loadDbStats = async () => {
    try {
      const [words, tests, storedSongs] = await Promise.all([
        db.words.toArray(),
        db.ieltsTests.toArray(),
        db.songs.toArray()
      ]);
      setDbStats({
        wordsCount: words.length,
        masteredCount: words.filter(w => w.masteryLevel === 3).length,
        testsCount: tests.length,
        songsCount: storedSongs.length
      });
    } catch (e) {
      console.warn('Failed to load DB stats:', e);
    }
  };

  useEffect(() => {
    loadDbStats();
  }, [songs]);

  const handleAccentChange = (accent: 'en-GB' | 'en-US') => {
    setAccentPreference(accent);
    try {
      localStorage.setItem('lyricalens_accent_preference', accent);
    } catch (e) {
      console.warn(e);
    }
    speakWord('pronunciation', accent);
    showToast(`发音口音已切换为：${accent === 'en-GB' ? '英式发音 (RP · 雅思标准)' : '美式发音 (GA)'}`);
  };

  const handleAutoPronounceToggle = () => {
    const nextVal = !autoPronounce;
    setAutoPronounce(nextVal);
    try {
      localStorage.setItem('lyricalens_auto_pronounce', String(nextVal));
    } catch (e) {
      console.warn(e);
    }
    showToast(nextVal ? '已开启生词查看时自动发音' : '已关闭自动发音');
  };

  const handleClearAudioCache = () => {
    setIsCleaningCache(true);
    try {
      localStorage.removeItem('ambient_lyrics_offsets');
      showToast('已清理临时音频解析缓存');
      setTimeout(() => {
        setIsCleaningCache(false);
      }, 500);
    } catch {
      setIsCleaningCache(false);
    }
  };

  // 6. Backup & Export States
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Save AI config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lyricalens_ai_config', JSON.stringify(aiConfig));
    } catch (e) {
      console.warn('Failed to save AI config to localStorage:', e);
    }
  }, [aiConfig]);

  const updateConfig = (patch: Partial<AIProviderConfig>) => {
    setAiConfig(prev => ({ ...prev, ...patch }));
    setPingResult({ status: 'idle' });
  };

  // Switch Major Provider (Gemini, DeepSeek, OpenAI, Claude, Custom)
  const handleSelectMajorProvider = (providerId: MajorAIProvider) => {
    const meta = MAJOR_AI_PROVIDERS.find(p => p.id === providerId);
    if (!meta) return;

    // Cache current credentials if not gemini
    if (aiConfig.majorProvider && aiConfig.majorProvider !== 'gemini' && aiConfig.customApiKey) {
      const updated = {
        ...savedProviderKeys,
        [aiConfig.majorProvider]: {
          apiKey: aiConfig.customApiKey,
          baseUrl: aiConfig.customBaseUrl,
          model: aiConfig.customModel
        }
      };
      setSavedProviderKeys(updated);
      try {
        localStorage.setItem('lyricalens_ai_saved_providers', JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
    }

    const isGemini = providerId === 'gemini';
    const saved = savedProviderKeys[providerId];
    const newApiKey = isGemini ? (aiConfig.geminiApiKey || '') : (saved?.apiKey || '');
    const newBaseUrl = isGemini ? '' : (saved?.baseUrl || meta.defaultBaseUrl || aiConfig.customBaseUrl);
    const newModel = isGemini ? (aiConfig.geminiModel || meta.defaultModel) : (saved?.model || meta.defaultModel);

    updateConfig({
      majorProvider: providerId,
      provider: isGemini ? 'gemini' : 'openai_compatible',
      geminiApiKey: isGemini ? newApiKey : aiConfig.geminiApiKey,
      customApiKey: isGemini ? '' : newApiKey,
      customBaseUrl: newBaseUrl,
      customModel: newModel,
      detectedModels: []
    });
    if (fetchModelsAbortRef.current) {
      fetchModelsAbortRef.current.abort();
      fetchModelsAbortRef.current = null;
    }
    setIsFetchingModels(false);
    setIsTestingPing(false);
    setPingResult({ status: 'idle' });
    showToast(`已切换至 ${meta.name} 模型`);
  };

  const fetchModelsAbortRef = useRef<AbortController | null>(null);

  // Dynamic Online Model Inspection & Handshake
  const handleFetchAndDetectModels = async () => {
    const currentMajor = aiConfig.majorProvider || (aiConfig.provider === 'gemini' ? 'gemini' : 'deepseek');
    const isGemini = currentMajor === 'gemini';
    const currentKey = isGemini ? (aiConfig.geminiApiKey || '') : (aiConfig.customApiKey || '');
    const currentBaseUrl = isGemini ? '' : (aiConfig.customBaseUrl || 'https://api.deepseek.com/v1');
    const isLocalEndpoint = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(currentBaseUrl.trim());

    if (!isGemini && !currentKey.trim() && !isLocalEndpoint) {
      setPingResult({
        status: 'error',
        msg: '请先填写 API Key 后再进行探测'
      });
      showToast('请先输入您的 API Key，再进行联网检测');
      return;
    }

    if (fetchModelsAbortRef.current) {
      fetchModelsAbortRef.current.abort();
    }
    const controller = new AbortController();
    fetchModelsAbortRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    setIsFetchingModels(true);
    setIsTestingPing(true);
    setPingResult({ status: 'idle' });

    try {
      const res = await fetch('/api/ai/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          provider: aiConfig.provider,
          majorProvider: currentMajor,
          baseUrl: currentBaseUrl,
          apiKey: currentKey
        })
      });

      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.models) && data.models.length > 0) {
        const detectedList = data.models;
        const currentActive = isGemini ? aiConfig.geminiModel : aiConfig.customModel;
        const newActiveModel = detectedList.includes(currentActive)
          ? currentActive
          : (data.defaultModel || detectedList[0]);

        updateConfig({
          detectedModels: detectedList,
          lastCheckedLatency: data.latency,
          lastCheckedTime: Date.now(),
          ...(isGemini ? { geminiModel: newActiveModel } : { customModel: newActiveModel })
        });

        setPingResult({
          status: 'success',
          latency: data.latency,
          msg: data.message || `握手成功 · 延迟 ${data.latency}ms · 已发现 ${detectedList.length} 个可用模型`
        });
        showToast(`联网检测成功：获取到 ${detectedList.length} 个可用模型`);
      } else {
        setPingResult({
          status: 'error',
          msg: data.error || '检测失败，请核对 API Key 或网络地址'
        });
        showToast(data.error || '联网检测失败，请核对 API Key');
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setPingResult({
          status: 'error',
          msg: '请求已取消或超时'
        });
      } else {
        setPingResult({
          status: 'error',
          msg: err.message || '网络请求超时'
        });
        showToast('联网检测超时，请检查网络连接');
      }
    } finally {
      clearTimeout(timeoutId);
      if (fetchModelsAbortRef.current === controller) {
        fetchModelsAbortRef.current = null;
        setIsFetchingModels(false);
        setIsTestingPing(false);
      }
    }
  };

  // Select music platform
  const handleSelectMusicPlatform = (platformId: MusicPlatformId) => {
    setActiveMusicPlatform(platformId);
    localStorage.setItem('lyricalens_active_music_platform', platformId);
    setPhoneInput('');
    setCaptchaInput('');
    setQrImg(null);
    const platform = MAJOR_MUSIC_PLATFORMS.find(p => p.id === platformId);
    if (platform) {
      setPlaylistUrl(platform.defaultPlaylistUrl);
    }
    if (platformId === 'local') {
      showToast('已切换至本地音频通道，可点击「选择本地音频」导入文件');
    }
  };

  // Local audio and LRC files importer
  const handleLocalAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const audioFiles = files.filter(f => f && (f.type?.startsWith('audio/') || /\.(mp3|wav|flac|m4a|aac|ogg)$/i.test(f.name || '')));
    const lrcFiles = files.filter(f => f && f.name?.toLowerCase().endsWith('.lrc'));

    if (audioFiles.length === 0) {
      showToast('未检测到支持的音频文件 (支持 .mp3, .flac, .wav, .m4a)');
      return;
    }

    showToast(`正在解析 ${audioFiles.length} 首本地音频...`);

    const lrcMap = new Map<string, string>();
    for (const lf of lrcFiles) {
      try {
        const text = await lf.text();
        const baseName = lf.name.replace(/\.lrc$/i, '').trim().toLowerCase();
        lrcMap.set(baseName, text);
      } catch {}
    }

    const PALETTES: [string, string, string][] = [
      ['#E6DFD5', '#CBD5C8', '#C3B8A8'],
      ['#D6DCE5', '#B8C5D6', '#E2D9CF'],
      ['#F2EBD9', '#D5E0D5', '#C0C7B8'],
      ['#EAE0D5', '#C6D8D3', '#BAC5B8'],
      ['#E3D7D1', '#D4C9BE', '#B6C4B6'],
      ['#DFE5E2', '#C8D5C8', '#B0BDB0']
    ];

    const newSongs: SongItem[] = [];
    for (let i = 0; i < audioFiles.length; i++) {
      const file = audioFiles[i];
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      const parts = cleanName.split('-');
      const artist = parts.length > 1 ? parts[0].trim() : '本地音频';
      const title = parts.length > 1 ? parts.slice(1).join('-').trim() : cleanName;
      const blobUrl = URL.createObjectURL(file);

      const base = cleanName.toLowerCase();
      const lrcText = lrcMap.get(base) || `[00:00.00]${title} - ${artist}\n[00:03.00]本地音频已入库，开启纯享研习时光`;

      const song: SongItem = {
        id: `local-${Date.now()}-${i}`,
        title,
        artist,
        duration: 180,
        albumArtUrl: `https://images.unsplash.com/photo-${1518495973542 + (i % 10)}?auto=format&fit=crop&w=800&q=80`,
        audioUrl: blobUrl,
        palette: PALETTES[i % PALETTES.length],
        keyVocab: [],
        lrcText
      };
      newSongs.push(song);
    }

    const chineseCount = newSongs.filter(s => isChineseSong(s)).length;
    const plName = `本地音频 (${newSongs.length} 首)`;

    if (chineseCount > 0) {
      setChinesePromptState({
        isOpen: true,
        allSongs: newSongs,
        playlistName: plName,
        isLocal: true
      });
    } else {
      await commitPlaylistImport(newSongs, plName, true);
    }

    // Reset input
    if (localFileInputRef.current) {
      localFileInputRef.current.value = '';
    }
  };

  // Sync Cloud Playlist action (Multi-platform: NetEase, QQ Music, KuGou, Migu, Spotify)
  const handleSyncPlaylist = async (customUrl?: string) => {
    const targetUrl = (customUrl || playlistUrl).trim();
    if (!targetUrl) {
      showToast('请输入有效的歌单链接或 ID');
      return;
    }
    setIsSyncingMusic(true);
    try {
      let rawSongs: SongItem[] = [];
      let plName = '';

      // 1. Direct client fetch (Works natively on standalone mobile APK via CapacitorHttp bypass)
      try {
        const clientRes = await fetchPlaylistClient(targetUrl, activeMusicPlatform as any);
        if (clientRes && clientRes.success && clientRes.songs && clientRes.songs.length > 0) {
          rawSongs = clientRes.songs;
          plName = clientRes.playlistName;
        }
      } catch (clientErr) {
        console.warn('Client direct sync error, trying backend API:', clientErr);
      }

      // 2. Fallback: Try backend API if available
      if (rawSongs.length === 0) {
        try {
          const res = await fetch('/api/music/sync-playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              playlistUrl: targetUrl, 
              platform: activeMusicPlatform,
              cookie: activeMusicPlatform === 'qq' ? (localStorage.getItem('lyricalens_qq_cookie') || '') : ncmCookie 
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.songs?.length > 0) {
              rawSongs = data.songs;
              plName = data.playlistName || '';
            }
          }
        } catch {
          // Backend API unreachable
        }
      }

      if (rawSongs.length > 0) {
        const currentPlatformOpt = MAJOR_MUSIC_PLATFORMS.find(p => p.id === activeMusicPlatform);
        const finalPlName = plName || `${currentPlatformOpt?.name || '云端'}歌单`;
        const chineseCount = rawSongs.filter(s => isChineseSong(s)).length;

        if (chineseCount > 0) {
          setChinesePromptState({
            isOpen: true,
            allSongs: rawSongs,
            playlistName: finalPlName,
            isLocal: false
          });
        } else {
          await commitPlaylistImport(rawSongs, finalPlName, false);
        }
      } else {
        if (targetUrl === 'curated-ielts-32' || targetUrl.includes('curated') || !navigator.onLine) {
          await commitPlaylistImport(SEED_SONGS, '雅思学术原声精选歌单 (官方全套)', false);
          showToast('已载入雅思学术原声精选歌单');
        } else {
          showToast('歌单同步失败，请确认该歌单设置为公开可访问，或尝试在音乐 App 中复制分享链接');
        }
      }
    } catch (err: any) {
      if (targetUrl === 'curated-ielts-32' || targetUrl.includes('curated') || !navigator.onLine) {
        await commitPlaylistImport(SEED_SONGS, '雅思学术原声精选歌单 (官方全套)', false);
        showToast('已载入雅思学术原声精选歌单');
      } else {
        showToast(`同步失败: ${err.message || '网络连接异常'}`);
      }
    } finally {
      setIsSyncingMusic(false);
    }
  };

  // Export full JSON backup
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const words = await db.words.toArray();
      const tests = await db.ieltsTests.toArray();
      const storedSongs = await db.songs.toArray();

      let checkinDates: string[] = [];
      try {
        const raw = localStorage.getItem('lyricalens_checkin_history');
        if (raw) checkinDates = JSON.parse(raw);
      } catch {}

      const backupData = {
        version: '1.3.0',
        exportedAt: new Date().toISOString(),
        appName: 'Lyricalens',
        profile: {
          checkinDaysCount: checkinDates.length,
          checkinDates
        },
        database: {
          words,
          ieltsTests: tests,
          songs: storedSongs
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lyricalens_learning_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('本地数据备份已导出');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('导出备份失败');
    } finally {
      setIsExporting(false);
    }
  };

  // Import JSON backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.database) {
          if (Array.isArray(parsed.database.words) && parsed.database.words.length > 0) {
            await db.words.bulkPut(parsed.database.words);
          }
          if (Array.isArray(parsed.database.ieltsTests) && parsed.database.ieltsTests.length > 0) {
            await db.ieltsTests.bulkPut(parsed.database.ieltsTests);
          }
          if (Array.isArray(parsed.database.songs) && parsed.database.songs.length > 0) {
            await db.songs.bulkPut(parsed.database.songs);
            setSongs(parsed.database.songs);
          }
          if (Array.isArray(parsed.profile?.checkinDates)) {
            localStorage.setItem('lyricalens_checkin_history', JSON.stringify(parsed.profile.checkinDates));
          }
          await loadDbStats();
          showToast(
            `恢复成功：${parsed.database.words?.length || 0} 词 · ${parsed.database.ieltsTests?.length || 0} 篇真题 · ${parsed.database.songs?.length || 0} 首曲目`
          );
        } else {
          showToast('无效的备份文件格式');
        }
      } catch (err) {
        console.error('Import error:', err);
        showToast('解析备份文件失败');
      } finally {
        setIsImporting(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const currentPlatformOpt = MAJOR_MUSIC_PLATFORMS.find(p => p.id === activeMusicPlatform) || MAJOR_MUSIC_PLATFORMS[0];
  const CurrentPlatformIcon = currentPlatformOpt.icon;

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-300">
      {/* 1. 音乐服务与音质 (多平台统一联动，无重复导入入口) */}
      <div className="rounded-3xl bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] p-5 space-y-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-stone-800 dark:text-stone-100">
            音乐服务与音质
          </h3>
          {syncedPlaylistName && activeMusicPlatform !== 'local' && (
            <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500 truncate max-w-[150px]">
              {syncedPlaylistName}
            </span>
          )}
        </div>

        {/* 音乐服务平台下拉选择器 */}
        <div className="relative">
          <label className="block text-[11px] font-sans font-medium text-stone-500 dark:text-stone-400 mb-2">
            音源服务平台
          </label>
          <button
            type="button"
            onClick={() => setIsMusicPlatformDropdownOpen(!isMusicPlatformDropdownOpen)}
            className="w-full h-11 px-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.05] border border-stone-900/[0.06] dark:border-white/[0.08] hover:border-stone-900/12 dark:hover:border-white/15 flex items-center justify-between text-left transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <CurrentPlatformIcon className="w-5 h-5 rounded shrink-0 shadow-2xs" />
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 truncate">
                {currentPlatformOpt.name}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-stone-400 transition-transform duration-150 shrink-0 ${
                isMusicPlatformDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {isMusicPlatformDropdownOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMusicPlatformDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -6 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  className="absolute top-full left-0 right-0 mt-1.5 p-1.5 rounded-2xl bg-[#FAF8F5]/98 dark:bg-[#18191C]/98 backdrop-blur-2xl border border-stone-900/10 dark:border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden space-y-0.5 origin-top"
                >
                  {MAJOR_MUSIC_PLATFORMS.map(platform => {
                    const Icon = platform.icon;
                    const isSelected = activeMusicPlatform === platform.id;
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => {
                          handleSelectMusicPlatform(platform.id);
                          setIsMusicPlatformDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-stone-900/[0.06] dark:bg-white/10 text-stone-900 dark:text-white font-semibold'
                            : 'text-stone-700 dark:text-stone-300 hover:bg-stone-900/[0.03] dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-5 h-5 rounded shrink-0 shadow-2xs" />
                          <span className="text-xs font-medium truncate">{platform.name}</span>
                        </div>
                        <div className="flex items-center shrink-0">
                          {isSelected ? (
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                          ) : (
                            <span className="w-4 h-4" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 动态专属平台操作区 (全流媒体平台统一支持：优先唤起本地 App 授权 + 扫码降级 + 歌单链接导入) */}
        {activeMusicPlatform === 'local' ? (
          /* 本地音频专属导入区 (不显示网络歌单同步栏) */
          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-stone-900/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block">
                本地离线音频与歌词导入
              </span>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                支持同时选择多个 .mp3 / .flac / .wav 及同名 .lrc 歌词文件
              </span>
            </div>
            <div className="shrink-0">
              <input
                ref={localFileInputRef}
                type="file"
                accept="audio/*,.lrc"
                multiple
                onChange={handleLocalAudioUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => localFileInputRef.current?.click()}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-950 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>选择本地文件</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 平台账号授权状态栏 (网易云 / QQ音乐 / 酷狗 / 酷我 / 咪咕 / Spotify 均支持本地 App 唤起与扫码授权) */}
            <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-stone-900/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-2">
              {activeMusicPlatform === 'netease' && ncmProfile ? (
                <>
                  <div
                    onClick={() => {
                      setShowPlaylists(prev => !prev);
                      if (userPlaylists.length === 0 && ncmCookie) {
                        loadUserProfileAndPlaylists(ncmCookie);
                      }
                    }}
                    className="flex items-center gap-2.5 cursor-pointer group select-none min-w-0"
                    title="点击展开/收起我的网易云歌单"
                  >
                    <img
                      src={ncmProfile.avatarUrl}
                      alt={ncmProfile.nickname}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-stone-200 dark:ring-stone-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate block">
                        {ncmProfile.nickname}
                      </span>
                      <span className="text-[10px] text-stone-400 font-sans block mt-0.5 truncate">
                        {showPlaylists ? '收起歌单' : '浏览歌单'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPlaylistInputOpen(!isPlaylistInputOpen)}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-900/[0.05] hover:bg-stone-900/[0.10] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-stone-700 dark:text-stone-200 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {isPlaylistInputOpen ? '收起链接' : '链接导入'}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadUserProfileAndPlaylists(ncmCookie)}
                      disabled={isLoadingPlaylists}
                      title="刷新云端歌单"
                      className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-900/[0.05] dark:hover:bg-white/[0.08] transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPlaylists ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNcmLogout}
                      title="退出账号"
                      className="p-1.5 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : activeMusicPlatform !== 'netease' && platformProfiles[activeMusicPlatform] ? (
                <>
                  <div
                    onClick={() => {
                      setShowPlaylists(prev => !prev);
                      if (activeMusicPlatform === 'qq' && qqPlaylists.length === 0) {
                        loadQqUserPlaylists();
                      }
                    }}
                    className="flex items-center gap-2.5 cursor-pointer group select-none min-w-0"
                    title="点击展开/收起我的云端歌单"
                  >
                    {platformProfiles[activeMusicPlatform]!.avatarUrl ? (
                      <img
                        src={platformProfiles[activeMusicPlatform]!.avatarUrl}
                        alt={platformProfiles[activeMusicPlatform]!.nickname}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-stone-200 dark:ring-stone-700 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-2 ring-stone-200 dark:ring-stone-700 overflow-hidden">
                        <CurrentPlatformIcon className="w-9 h-9" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate block">
                        {platformProfiles[activeMusicPlatform]!.nickname}
                      </span>
                      <span className="text-[10px] text-stone-400 font-sans block mt-0.5 truncate">
                        {showPlaylists ? '收起歌单' : '浏览歌单'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPlaylistInputOpen(!isPlaylistInputOpen)}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-900/[0.05] hover:bg-stone-900/[0.10] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-stone-700 dark:text-stone-200 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {isPlaylistInputOpen ? '收起链接' : '链接导入'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (activeMusicPlatform === 'qq') {
                          loadQqUserPlaylists();
                        } else {
                          handleSyncPlaylist();
                        }
                      }}
                      disabled={isLoadingPlaylists || isSyncingMusic}
                      title="刷新云端歌单"
                      className="p-1.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-900/[0.05] dark:hover:bg-white/[0.08] transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPlaylists || isSyncingMusic ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogoutOtherPlatform(activeMusicPlatform)}
                      title="退出账号"
                      className="p-1.5 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-stone-900/[0.05] dark:bg-white/[0.06] text-stone-400 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block truncate">
                        {activeMusicPlatform === 'netease'
                          ? '网易云账号未登录'
                          : `${currentPlatformOpt.name}账号未登录`}
                      </span>
                      <span className="text-[10px] text-stone-400 block truncate">
                        支持手机验证码秒级免跳端登录或{currentPlatformOpt.shortName}扫码授权
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPlaylistInputOpen(!isPlaylistInputOpen)}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-900/[0.06] hover:bg-stone-900/[0.12] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-stone-700 dark:text-stone-200 text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap"
                    >
                      {isPlaylistInputOpen ? '收起' : '链接导入'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startQrLogin(true)}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95 whitespace-nowrap"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>授权登录</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 平台歌单链接折叠输入框 */}
            <AnimatePresence>
              {isPlaylistInputOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                      <input
                        type="text"
                        value={playlistUrl}
                        onChange={e => setPlaylistUrl(e.target.value)}
                        placeholder={currentPlatformOpt.placeholder}
                        className="w-full pl-8.5 pr-3 py-2 rounded-xl bg-white/70 dark:bg-white/[0.05] border border-stone-900/[0.08] dark:border-white/10 text-xs font-mono text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/30"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (navigator.clipboard?.readText) {
                            const clipText = await navigator.clipboard.readText();
                            if (clipText && clipText.trim()) {
                              setPlaylistUrl(clipText.trim());
                              showToast('已从剪贴板粘贴歌单链接');
                            } else {
                              showToast('剪贴板中暂无内容');
                            }
                          } else {
                            showToast('请直接长按输入框粘贴');
                          }
                        } catch {
                          showToast('请长按输入框粘贴');
                        }
                      }}
                      className="px-2.5 py-2 rounded-xl bg-stone-900/[0.06] hover:bg-stone-900/[0.12] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-stone-700 dark:text-stone-200 text-xs font-medium transition-all cursor-pointer shrink-0"
                      title="粘贴剪贴板"
                    >
                      粘贴
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSyncPlaylist();
                        setIsPlaylistInputOpen(false);
                      }}
                      disabled={isSyncingMusic}
                      className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:text-stone-950 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMusic ? 'animate-spin' : ''}`} />
                      <span>{isSyncingMusic ? '同步中' : '同步歌单'}</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 已登录网易云 / QQ音乐用户的云端歌单网格 */}
            {((activeMusicPlatform === 'netease' && ncmProfile) || (activeMusicPlatform === 'qq' && platformProfiles.qq)) && showPlaylists && (() => {
              const currentPlaylists = activeMusicPlatform === 'qq' ? qqPlaylists : userPlaylists;
              return (
                <div className="space-y-2 pt-1 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-stone-600 dark:text-stone-400 flex items-center gap-1.5">
                      <ListMusic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>我的云端歌单 (点击一键载入)</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      {isLoadingPlaylists ? '加载中...' : `共 ${currentPlaylists.length} 个`}
                    </span>
                  </div>

                  {isLoadingPlaylists ? (
                    <div className="py-5 text-center text-stone-400 text-xs flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-emerald-400" />
                      <span>正在获取云端歌单...</span>
                    </div>
                  ) : currentPlaylists.length === 0 ? (
                    <div className="py-3 text-center text-stone-400 text-xs">
                      <span>暂无歌单，</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (activeMusicPlatform === 'qq') {
                            loadQqUserPlaylists();
                          } else {
                            loadUserProfileAndPlaylists(ncmCookie);
                          }
                        }}
                        className="text-stone-700 dark:text-stone-300 underline cursor-pointer ml-1"
                      >
                        点击重试
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                      {currentPlaylists.map(pl => (
                        <div
                          key={pl.id}
                          onClick={() => {
                            setPlaylistUrl(String(pl.id));
                            handleSyncPlaylist(String(pl.id));
                          }}
                          className="group flex items-center gap-2.5 p-2 rounded-2xl bg-white/60 dark:bg-white/[0.04] hover:bg-white/90 dark:hover:bg-white/[0.08] border border-stone-900/[0.05] dark:border-white/[0.06] transition-all cursor-pointer select-none"
                        >
                          <img
                            src={pl.coverImgUrl}
                            alt={pl.name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                          />
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-medium text-stone-800 dark:text-stone-200 truncate">
                              {pl.name}
                            </h5>
                            <span className="text-[10px] text-stone-400 font-mono block mt-0.5">
                              {pl.trackCount} 首单曲
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* 播放音质规格 (紧凑 5 档分段控件) */}
        <div className="pt-2 border-t border-stone-900/[0.05] dark:border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-sans font-medium text-stone-500 dark:text-stone-400">
              播放音质规格
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              {AUDIO_QUALITY_OPTIONS.find(o => o.key === audioQuality)?.desc.split('·')[0]?.trim()}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl bg-stone-900/[0.04] dark:bg-white/[0.05]">
            {AUDIO_QUALITY_OPTIONS.map(opt => {
              const isSelected = audioQuality === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setAudioQuality(opt.key)}
                  className={`py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs font-semibold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  <span className="text-[11px] block leading-tight">{opt.label}</span>
                  <span className="text-[9px] font-mono text-stone-400 dark:text-stone-500 block mt-0.5">
                    {opt.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 底部同步状态与曲目预览开关 */}
        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 pt-1 border-t border-stone-900/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">
              {lastSyncTime
                ? `上次同步：${lastSyncTime}`
                : `当前已载入 ${songs.length} 首曲目`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowTrackListPreview(!showTrackListPreview)}
            className="text-[11px] text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:hover:text-white font-medium cursor-pointer shrink-0 whitespace-nowrap"
          >
            {showTrackListPreview ? '收起曲目' : `查看已入库 (${songs.length} 首)`}
          </button>
        </div>

        {showTrackListPreview && <TrackListWithFadingScrollbar songs={songs} />}
      </div>

      {/* 2. 语音朗读与发音偏好 (移除无效难度梯度，专注口音与自动朗读) */}
      <div className="rounded-3xl bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-stone-800 dark:text-stone-100">
            语音朗读与发音偏好
          </h3>
          <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
            {accentPreference === 'en-GB' ? 'RP 英音' : 'GA 美音'}
          </span>
        </div>

        {/* 口音选择 (点击实时试听) */}
        <div className="mb-4">
          <label className="block text-[11px] font-sans font-medium text-stone-500 dark:text-stone-400 mb-3">
            标准词典发音口音 (点击即刻试听)
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'en-GB', label: '英式发音 (RP)', desc: '剑桥雅思听力官方标准音' },
              { id: 'en-US', label: '美式发音 (GA)', desc: '北美通用自然标准发音' }
            ].map(acc => {
              const isSelected = accentPreference === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => handleAccentChange(acc.id as 'en-GB' | 'en-US')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 border-stone-900 dark:border-white shadow-xs'
                      : 'bg-white/60 dark:bg-white/[0.04] border-stone-900/[0.06] dark:border-white/[0.06] text-stone-700 dark:text-stone-300 hover:bg-white/80'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-xs font-semibold block">{acc.label}</span>
                    <span
                      className={`text-[10px] font-sans block mt-0.5 ${
                        isSelected ? 'text-stone-300 dark:text-stone-600' : 'text-stone-400'
                      }`}
                    >
                      {acc.desc}
                    </span>
                  </div>
                  <Volume2
                    className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      isSelected ? 'text-emerald-400 dark:text-emerald-600' : 'text-stone-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* 自动朗读开关 */}
        <div className="flex items-center justify-between pt-2.5 border-t border-stone-900/[0.05] dark:border-white/[0.06]">
          <div>
            <span className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
              点按查词时自动发音
            </span>
            <span className="text-[10px] text-stone-400">
              展开单词释义抽屉时自动朗读该词的标准发音
            </span>
          </div>
          <button
            type="button"
            onClick={handleAutoPronounceToggle}
            aria-pressed={autoPronounce}
            className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 shrink-0 ${
              autoPronounce ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform transform shadow-xs ${
                autoPronounce ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. AI 引擎与大模型配置 */}
      {(() => {
        const currentMeta =
          MAJOR_AI_PROVIDERS.find(p => p.id === (aiConfig.majorProvider || 'deepseek')) ||
          MAJOR_AI_PROVIDERS[0];
        const isGemini = currentMeta.id === 'gemini';
        const activeModel = isGemini
          ? aiConfig.geminiModel || 'gemini-2.5-flash'
          : aiConfig.customModel || currentMeta.defaultModel;
        const ProviderIcon = currentMeta.icon;
        const currentConfigured = isProviderConfigured(currentMeta.id);

        return (
          <div className="relative z-20 rounded-3xl bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] p-5 space-y-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]">
            {/* 顶栏：标题与配置密钥按钮 */}
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-stone-800 dark:text-stone-100">
                AI 引擎与模型
              </h3>

              <div className="flex items-center gap-2">
                {pingResult.status === 'success' && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{pingResult.latency ? `${pingResult.latency}ms` : '已连通'}</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => setIsAiConfigModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white/70 hover:bg-white dark:bg-white/[0.08] dark:hover:bg-white/[0.14] border border-stone-900/[0.06] dark:border-white/[0.08] text-stone-700 dark:text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                  <span>配置密钥</span>
                </button>
              </div>
            </div>

            {/* 1. 服务商下拉选择框 (清晰区分已就绪 vs 待配置) */}
            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-sans font-medium text-stone-500 dark:text-stone-400">
                智能解析服务商
              </label>
              <button
                type="button"
                onClick={() => setIsProviderDropdownOpen(!isProviderDropdownOpen)}
                className="w-full h-11 px-3.5 rounded-2xl bg-white/60 dark:bg-white/[0.05] border border-stone-900/[0.06] dark:border-white/[0.08] hover:border-stone-900/12 dark:hover:border-white/15 flex items-center justify-between text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg bg-white dark:bg-stone-800 flex items-center justify-center border border-stone-200/80 dark:border-stone-700 shrink-0 ${currentMeta.brandColor}`}
                  >
                    <ProviderIcon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 truncate">
                    {currentMeta.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                      currentConfigured
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        currentConfigured ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'
                      }`}
                    />
                    <span>{currentConfigured ? '已就绪' : '待配置'}</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-stone-400 transition-transform duration-150 ${
                      isProviderDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {isProviderDropdownOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProviderDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -6 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      className="absolute top-full left-0 right-0 mt-1.5 p-1.5 rounded-2xl bg-[#FAF8F5]/98 dark:bg-[#18191C]/98 backdrop-blur-2xl border border-stone-900/10 dark:border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.16)] dark:shadow-[0_20px_48px_rgba(0,0,0,0.6)] z-50 max-h-72 overflow-y-auto space-y-0.5 origin-top"
                    >
                      {MAJOR_AI_PROVIDERS.map(p => {
                        const Icon = p.icon;
                        const isSelected = (aiConfig.majorProvider || 'deepseek') === p.id;
                        const configured = isProviderConfigured(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              handleSelectMajorProvider(p.id);
                              setIsProviderDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-stone-900/[0.06] dark:bg-white/10 text-stone-900 dark:text-white font-semibold'
                                : 'text-stone-700 dark:text-stone-300 hover:bg-stone-900/[0.03] dark:hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-6 h-6 rounded-lg bg-white dark:bg-stone-800 flex items-center justify-center border border-stone-200/60 dark:border-stone-700 shrink-0 ${p.brandColor}`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-medium truncate">{p.name}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                                  configured
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-stone-400 dark:text-stone-500'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    configured ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-600'
                                  }`}
                                />
                                <span>{configured ? '已就绪' : '待配置'}</span>
                              </span>
                              {isSelected ? (
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                              ) : (
                                <span className="w-4 h-4" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 2. 选用模型型号 */}
            <div className="pt-2 border-t border-stone-900/[0.05] dark:border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-sans font-medium text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-stone-400" />
                  <span>选用模型型号</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomModelInput(!isCustomModelInput)}
                  className="text-[11px] text-stone-600 dark:text-stone-300 hover:underline cursor-pointer"
                >
                  {isCustomModelInput ? '切换在线选择' : '手动输入型号'}
                </button>
              </div>

              {isCustomModelInput ? (
                <input
                  type="text"
                  value={activeModel}
                  onChange={e => {
                    if (isGemini) {
                      updateConfig({ geminiModel: e.target.value });
                    } else {
                      updateConfig({ customModel: e.target.value });
                    }
                  }}
                  placeholder="输入模型名称，如 deepseek-chat, gpt-4o..."
                  className="w-full h-10 px-3.5 rounded-xl bg-white/70 dark:bg-white/[0.05] border border-stone-900/[0.08] dark:border-white/10 text-xs font-mono text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/30"
                />
              ) : aiConfig.detectedModels && aiConfig.detectedModels.length > 0 ? (
                <div className="relative">
                  <select
                    value={activeModel}
                    onChange={e => {
                      const val = e.target.value;
                      if (isGemini) {
                        updateConfig({ geminiModel: val });
                      } else {
                        updateConfig({ customModel: val });
                      }
                      showToast(`已选用模型: ${val}`);
                    }}
                    className="w-full h-10 pl-3.5 pr-8 rounded-xl bg-white/70 dark:bg-white/[0.05] border border-stone-900/[0.08] dark:border-white/10 text-xs font-mono text-stone-800 dark:text-stone-200 focus:outline-none cursor-pointer appearance-none"
                  >
                    {aiConfig.detectedModels.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronRight className="w-4 h-4 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                </div>
              ) : (
                <div className="h-10 px-3.5 rounded-xl bg-white/50 dark:bg-white/[0.03] border border-dashed border-stone-900/10 dark:border-white/10 text-stone-500 dark:text-stone-400 text-xs flex items-center justify-between">
                  <span className="font-mono text-[11px] truncate">
                    {activeModel ? `当前型号: ${activeModel}` : '点击右上角「配置密钥」进行探测'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomModelInput(true)}
                    className="text-[11px] text-stone-700 dark:text-stone-300 font-medium hover:underline shrink-0 ml-2 cursor-pointer"
                  >
                    修改
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* 4. 数据存储与备份管理 */}
      <div className="rounded-3xl bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] p-5 space-y-4 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-stone-800 dark:text-stone-100">
            数据存储与备份
          </h3>
          <button
            type="button"
            onClick={loadDbStats}
            className="text-[11px] text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>刷新</span>
          </button>
        </div>

        {/* 4-Stat Horizontal Summary (Unified Palette) */}
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-stone-900/[0.05] dark:border-white/[0.05] text-center">
            <span className="text-[10px] text-stone-400 block mb-0.5 whitespace-nowrap">词库总计</span>
            <span className="text-base font-bold font-mono text-stone-800 dark:text-stone-100 tabular-nums">
              {dbStats.wordsCount}
            </span>
            <span className="text-[9px] text-stone-400 block">词</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-stone-900/[0.05] dark:border-white/[0.05] text-center">
            <span className="text-[10px] text-stone-400 block mb-0.5 whitespace-nowrap">已掌握词</span>
            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {dbStats.masteredCount}
            </span>
            <span className="text-[9px] text-stone-400 block">词</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-stone-900/[0.05] dark:border-white/[0.05] text-center">
            <span className="text-[10px] text-stone-400 block mb-0.5 whitespace-nowrap">模考档案</span>
            <span className="text-base font-bold font-mono text-stone-800 dark:text-stone-100 tabular-nums">
              {dbStats.testsCount}
            </span>
            <span className="text-[9px] text-stone-400 block">篇</span>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-stone-900/[0.05] dark:border-white/[0.05] text-center">
            <span className="text-[10px] text-stone-400 block mb-0.5 whitespace-nowrap">入库曲目</span>
            <span className="text-base font-bold font-mono text-stone-800 dark:text-stone-100 tabular-nums">
              {dbStats.songsCount}
            </span>
            <span className="text-[9px] text-stone-400 block">首</span>
          </div>
        </div>

        {/* Clean Temporary Cache */}
        <div className="pt-2 flex items-center justify-between border-t border-stone-900/[0.05] dark:border-white/[0.06]">
          <div>
            <span className="text-xs font-medium text-stone-800 dark:text-stone-200 block">
              清理音频临时缓存
            </span>
            <span className="text-[10px] text-stone-400">
              清理歌词轴微调与播放缓存（不影响生词与模考记录）
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearAudioCache}
            disabled={isCleaningCache}
            className="px-3 py-1.5 rounded-xl bg-stone-900/[0.05] hover:bg-rose-500/10 hover:text-rose-600 dark:bg-white/[0.06] dark:hover:bg-rose-500/15 dark:hover:text-rose-300 text-stone-700 dark:text-stone-300 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isCleaningCache ? '清理中...' : '清理缓存'}</span>
          </button>
        </div>

        {/* Action Buttons: Export & Import */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-stone-900/[0.05] dark:border-white/[0.06]">
          <button
            type="button"
            onClick={handleExportBackup}
            disabled={isExporting}
            className="py-2.5 px-3 rounded-2xl bg-white/70 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-stone-900/[0.06] dark:border-white/[0.08] text-stone-800 dark:text-stone-100 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
            <span>{isExporting ? '导出中...' : '导出 JSON 备份'}</span>
          </button>

          <label className="py-2.5 px-3 rounded-2xl bg-white/70 hover:bg-white dark:bg-white/[0.06] dark:hover:bg-white/[0.12] border border-stone-900/[0.06] dark:border-white/[0.08] text-stone-800 dark:text-stone-100 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isImporting ? '恢复中...' : '恢复备份文件'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Multi-Platform Music App Deep-Link + QR Code Login Modal (Rendered in Portal to escape scroll mask) */}
      {portalContainer && createPortal(
        <AnimatePresence>
          {isQrModalOpen && (() => {
            const ModalPlatformIcon = currentPlatformOpt.icon;
            const brandHex = currentPlatformOpt.brandHex || '#E60026';
            const schemeLabel = currentPlatformOpt.appSchemeName || 'orpheus://';
            const step2Guide = currentPlatformOpt.scanGuideStep2 || `在${currentPlatformOpt.shortName}首页或侧边栏打开「扫一扫」→ 右上角「相册」`;
            return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
              onClick={() => {
                if (qrStatus !== 'loading' && qrStatus !== 'waiting_confirm') {
                  if (launchTimerRef.current) {
                    window.clearTimeout(launchTimerRef.current);
                    launchTimerRef.current = null;
                  }
                  setIsQrModalOpen(false);
                }
              }}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 12 }}
                transition={{ type: 'spring', damping: 25, stiffness: 320 }}
                className="w-full max-w-[348px] sm:max-w-sm max-h-[min(640px,90vh)] overflow-y-auto no-scrollbar rounded-3xl bg-[#FAF8F5] dark:bg-[#18191C] border border-stone-200/80 dark:border-stone-700/80 shadow-2xl p-5 sm:p-6 relative text-stone-900 dark:text-stone-100"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (launchTimerRef.current) {
                      window.clearTimeout(launchTimerRef.current);
                      launchTimerRef.current = null;
                    }
                    setIsQrModalOpen(false);
                  }}
                  className="absolute right-4 top-4 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center justify-center transition-colors cursor-pointer"
                  title="关闭"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="text-center space-y-1 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400 block">
                    {currentPlatformOpt.enTitle || 'MUSIC APP CONNECT'}
                  </span>
                  <h3 className="text-base font-bold tracking-tight text-stone-900 dark:text-stone-100">
                    {currentPlatformOpt.name} VIP 授权与登录
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    官方扫码 · 手机验证码登录
                  </p>
                </div>

                {/* Unified 2-Tab Segmented Control (Phone SMS + QR Scan) across all music platforms */}
                <div className="flex rounded-2xl bg-stone-900/[0.05] dark:bg-white/[0.06] p-1 mb-3.5 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setNcmAuthTab('phone')}
                    className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      ncmAuthTab === 'phone'
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" style={{ color: brandHex }} />
                    <span>手机验证码 (推荐)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNcmAuthTab('qr')}
                    className={`flex-1 py-1.5 px-2 rounded-xl font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      ncmAuthTab === 'qr'
                        ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-xs font-semibold'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 text-stone-500" />
                    <span>扫码授权</span>
                  </button>
                </div>

                {ncmAuthTab === 'phone' ? (
                  <div
                    key="platform-tab-phone"
                    className="space-y-3"
                  >
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                            手机号码
                          </label>
                          <div className="flex items-center rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 px-3 py-2 text-xs">
                            <span className="text-stone-400 font-mono pr-2 border-r border-stone-200 dark:border-stone-700 mr-2 shrink-0">+86</span>
                            <input
                              type="tel"
                              maxLength={11}
                              value={phoneInput}
                              onChange={e => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                              placeholder={`输入11位${currentPlatformOpt.shortName}手机号`}
                              className="w-full bg-transparent font-mono text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-stone-600 dark:text-stone-400">
                            短信验证码
                          </label>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              maxLength={6}
                              value={captchaInput}
                              onChange={e => setCaptchaInput(e.target.value.trim())}
                              placeholder="4位或6位验证码"
                              className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-mono text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleSendPhoneCaptcha}
                              disabled={isSendingCaptcha || captchaCountdown > 0 || phoneInput.trim().length !== 11}
                              className="px-3 py-2 rounded-xl bg-stone-900/[0.06] hover:bg-stone-900/[0.12] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-stone-700 dark:text-stone-200 text-xs font-medium shrink-0 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {isSendingCaptcha ? '发送中...' : captchaCountdown > 0 ? `${captchaCountdown}s后重发` : '获取验证码'}
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleLoginWithPhoneCaptcha}
                          disabled={isLoggingInPhone || phoneInput.trim().length !== 11 || !captchaInput.trim()}
                          style={{ backgroundColor: brandHex }}
                          className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl hover:opacity-92 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 mt-1"
                        >
                          {isLoggingInPhone ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          <span>{isLoggingInPhone ? '正在验证登录...' : '立即登录'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key="platform-tab-qr"
                    >
                      <div className="relative flex flex-col items-center justify-center my-1">
                        <div className="relative w-40 h-40 sm:w-44 sm:h-44 p-2.5 rounded-2xl bg-white border border-stone-200 dark:border-stone-700 shadow-inner flex items-center justify-center overflow-hidden">
                          {qrStatus === 'loading' && (
                            <div className="flex flex-col items-center justify-center text-center p-4 space-y-3">
                              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                              <span className="text-xs text-stone-600 font-medium">
                                正在建立官方认证通道...
                              </span>
                            </div>
                          )}

                          {qrImg && (qrStatus === 'waiting_scan' || qrStatus === 'waiting_confirm' || qrStatus === 'expired') && (
                            <img
                              src={qrImg}
                              alt={`${currentPlatformOpt.shortName}登录二维码`}
                              className={`w-full h-full object-contain transition-all duration-300 ${
                                qrStatus === 'expired' ? 'blur-xs opacity-20' : qrStatus === 'waiting_confirm' ? 'opacity-25' : 'opacity-100'
                              }`}
                            />
                          )}

                          {qrStatus === 'waiting_confirm' && (
                            <div className="absolute inset-0 bg-white/92 dark:bg-stone-900/92 flex flex-col items-center justify-center p-4 text-center space-y-2 animate-in fade-in">
                              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
                                <Smartphone className="w-6 h-6" />
                              </div>
                              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                扫描成功！
                              </h4>
                              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                                请在{currentPlatformOpt.shortName} App 上轻触「确认登录」
                              </p>
                            </div>
                          )}

                          {qrStatus === 'expired' && (
                            <div className="absolute inset-0 bg-white/90 dark:bg-stone-900/90 flex flex-col items-center justify-center p-4 text-center space-y-2.5 animate-in fade-in">
                              <AlertCircle className="w-8 h-8 text-amber-500" />
                              <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                                二维码已失效
                              </span>
                              <button
                                type="button"
                                onClick={() => startQrLogin(true)}
                                className="px-3.5 py-1.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>点击刷新</span>
                              </button>
                            </div>
                          )}

                          {qrStatus === 'success' && (
                            <div className="absolute inset-0 bg-white dark:bg-stone-900 flex flex-col items-center justify-center p-4 text-center space-y-2 animate-in zoom-in-95">
                              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <CheckCircle2 className="w-7 h-7" />
                              </div>
                              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                                登录授权成功！
                              </h4>
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                已同步您的专属歌单与原声音源
                              </p>
                            </div>
                          )}

                          {qrStatus === 'error' && (
                            <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                              <AlertCircle className="w-8 h-8 text-rose-500" />
                              <span className="text-xs text-rose-600 font-medium">{qrStatusText}</span>
                              <button
                                type="button"
                                onClick={() => startQrLogin(true)}
                                className="mt-1 px-3 py-1 rounded-lg bg-stone-200 dark:bg-stone-700 text-xs font-medium cursor-pointer"
                              >
                                重试
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mt-1.5 text-center">
                          <span className="text-xs text-stone-600 dark:text-stone-400 font-medium block">
                            {qrStatusText}
                          </span>
                        </div>
                      </div>

                      {/* QR Actions */}
                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={handleSaveQrAndLaunchApp}
                          disabled={!qrImg || qrStatus === 'loading' || qrStatus === 'success'}
                          style={{ backgroundColor: brandHex }}
                          className="w-full min-h-[46px] py-2.5 px-4 rounded-2xl hover:opacity-92 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
                        >
                          <Download className="w-4 h-4 shrink-0 text-white" />
                          <span>
                            {activeMusicPlatform === 'qq'
                              ? '保存二维码并打开 QQ'
                              : `保存二维码并打开${currentPlatformOpt.shortName}`}
                          </span>
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => startQrLogin(true)}
                          disabled={qrStatus === 'loading' || qrStatus === 'success'}
                          className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors disabled:opacity-40"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${qrStatus === 'loading' ? 'animate-spin' : ''}`} />
                          <span>刷新二维码</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsQrModalOpen(false)}
                          className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium transition-colors cursor-pointer"
                        >
                          关闭
                        </button>
                      </div>
                    </div>
                  )}
              </motion.div>
            </motion.div>
            );
          })()}
        </AnimatePresence>,
        portalContainer
      )}

      {/* AI Key & Connection Config Modal (Rendered in Portal to escape scroll mask) */}
      {portalContainer && createPortal(
        <AnimatePresence>
          {isAiConfigModalOpen && (() => {
            const currentMeta = MAJOR_AI_PROVIDERS.find(p => p.id === (aiConfig.majorProvider || 'deepseek')) || MAJOR_AI_PROVIDERS[0];
            const isGemini = currentMeta.id === 'gemini';
            const activeKey = isGemini ? (aiConfig.geminiApiKey || '') : (aiConfig.customApiKey || '');
            const currentBaseUrl = isGemini ? '' : (aiConfig.customBaseUrl || currentMeta.defaultBaseUrl || '');
            const isLocalEndpoint = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(currentBaseUrl.trim());
            const canProbe = isGemini || Boolean(activeKey.trim()) || isLocalEndpoint;
            const ProviderIcon = currentMeta.icon;

            const closeAiModal = () => {
              if (fetchModelsAbortRef.current) {
                fetchModelsAbortRef.current.abort();
                fetchModelsAbortRef.current = null;
              }
              setIsFetchingModels(false);
              setIsTestingPing(false);
              setIsAiConfigModalOpen(false);
            };

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs"
                onClick={closeAiModal}
              >
                <motion.div
                  initial={{ scale: 0.94, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                  className="w-full max-w-[340px] sm:max-w-sm max-h-[min(580px,85%)] overflow-y-auto no-scrollbar bg-[#FAF8F5] dark:bg-[#18191C] border border-stone-200 dark:border-stone-700/80 rounded-3xl p-5 shadow-2xl space-y-4 text-stone-900 dark:text-stone-100"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200/70 dark:border-stone-800">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border border-stone-200/60 dark:border-stone-700 ${currentMeta.brandColor} bg-white dark:bg-stone-800 shadow-2xs shrink-0`}>
                        <ProviderIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                          配置 {currentMeta.name} 密钥与连接
                        </h3>
                        <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate">
                          用于剑桥真题长难句精讲与生词深度释义
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closeAiModal}
                      className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5 shrink-0">
                          <Key className="w-3.5 h-3.5 text-stone-400" />
                          <span>API 密钥 (API Key)</span>
                        </label>
                        {isGemini && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate">
                            已内置系统通道
                          </span>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={activeKey}
                          onChange={e => {
                            if (isGemini) {
                              updateConfig({ geminiApiKey: e.target.value });
                            } else {
                              updateConfig({ customApiKey: e.target.value });
                            }
                          }}
                          placeholder={currentMeta.apiKeyPlaceholder}
                          className="w-full h-10 pl-3 pr-8 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-mono text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/30"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer p-1"
                        >
                          {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5 shrink-0">
                          <Globe className="w-3.5 h-3.5 text-stone-400" />
                          <span>接口地址 (Base URL)</span>
                        </label>
                        <span className="text-[10px] text-stone-400 dark:text-stone-500 truncate">
                          留空使用官方默认
                        </span>
                      </div>
                      <input
                        type="text"
                        value={aiConfig.customBaseUrl || ''}
                        onChange={e => updateConfig({ customBaseUrl: e.target.value })}
                        placeholder={currentMeta.defaultBaseUrl || 'https://api.openai.com/v1'}
                        className="w-full h-10 px-3 rounded-xl bg-white dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-mono text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/30"
                      />
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={handleFetchAndDetectModels}
                        disabled={!canProbe || isFetchingModels || isTestingPing}
                        className="h-9 px-3 rounded-xl bg-stone-200/70 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shrink-0"
                      >
                        {!canProbe ? (
                          <>
                            <Key className="w-3.5 h-3.5 text-stone-400" />
                            <span>请先填写 API Key</span>
                          </>
                        ) : isFetchingModels ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>探测中...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-500 fill-current" />
                            <span>联网探测模型</span>
                          </>
                        )}
                      </button>

                      {pingResult.status === 'success' && (
                        <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">连通 ({pingResult.latency}ms)</span>
                        </span>
                      )}
                      {pingResult.status === 'error' && (
                        <span className="text-xs font-mono text-rose-500 flex items-center gap-1 truncate">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{pingResult.msg || '连接失败'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-200/70 dark:border-stone-800 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentMeta.id !== 'gemini' && aiConfig.customApiKey) {
                          const updated = {
                            ...savedProviderKeys,
                            [currentMeta.id]: {
                              apiKey: aiConfig.customApiKey,
                              baseUrl: aiConfig.customBaseUrl,
                              model: aiConfig.customModel
                            }
                          };
                          setSavedProviderKeys(updated);
                          try {
                            localStorage.setItem('lyricalens_ai_saved_providers', JSON.stringify(updated));
                          } catch (e) {
                            console.warn(e);
                          }
                        }
                        setIsAiConfigModalOpen(false);
                        showToast(`已保存 ${currentMeta.name} 配置`);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 text-xs font-semibold cursor-pointer shadow-xs transition-all text-center"
                    >
                      保存并收起
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>,
        portalContainer
      )}

      {/* Chinese Songs Import Confirmation Prompt Modal */}
      <ChineseSongPromptModal
        isOpen={chinesePromptState.isOpen}
        onClose={() => setChinesePromptState(prev => ({ ...prev, isOpen: false }))}
        onConfirmImportEnglishOnly={handleConfirmImportEnglishOnly}
        onConfirmImportAll={handleConfirmImportAll}
        allSongs={chinesePromptState.allSongs}
        playlistName={chinesePromptState.playlistName}
      />
    </div>
  );
};
