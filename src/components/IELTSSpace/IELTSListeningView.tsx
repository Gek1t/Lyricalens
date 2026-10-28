import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  SkipBack,
  SkipForward,
  Check,
  FileCheck,
  Repeat
} from 'lucide-react';
import { IELTSListeningSection, IELTSListeningQuestion } from '../../data/ieltsListening';
import { getListeningBilingualMeta } from '../../data/ieltsTopicSynonyms';
import { useAppStore } from '../../store/useAppStore';
import { speakWord } from '../../utils/audioEngine';
import { lookupLyricTerm, cleanWordText } from '../../utils/lyricDictionary';
import { db } from '../../db';

interface IELTSListeningViewProps {
  section: IELTSListeningSection;
  onBack: () => void;
  onOpenNotebook: () => void;
}

export const IELTSListeningView: React.FC<IELTSListeningViewProps> = ({
  section
}) => {
  const [activeTab, setActiveTab] = useState<'exam' | 'transcript'>('exam');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [currentParagraphIdx, setCurrentParagraphIdx] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isExamSubmitted, setIsExamSubmitted] = useState<boolean>(false);
  const [repeatSentence, setRepeatSentence] = useState<boolean>(false);
  const [isScrolledCompact, setIsScrolledCompact] = useState<boolean>(false);

  // User answers keyed by question ID
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  const showToast = useAppStore(s => s.showToast);
  const openWordDetail = useAppStore(s => s.openWordDetail);

  const isPlayingRef = useRef<boolean>(false);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const bilingualMeta = useMemo(() => getListeningBilingualMeta(section), [section]);

  // Query collected words from Dexie database to highlight saved words in transcript
  const collectedWords = useLiveQuery(() => db.words.toArray(), []);
  const savedWordsSet = useMemo(() => {
    if (!collectedWords) return new Set<string>();
    const set = new Set<string>();
    for (const item of collectedWords) {
      if (item.word) {
        const clean = cleanWordText(item.word).toLowerCase();
        if (clean) set.add(clean);
      }
    }
    return set;
  }, [collectedWords]);

  const handleTranscriptWordClick = async (
    wordText: string,
    sentenceText: string,
    targetEl?: HTMLElement | null
  ) => {
    const cleaned = cleanWordText(wordText);
    if (!cleaned || cleaned.length < 2) return;

    let heroRect: { x: number; y: number; width: number; height: number } | null = null;
    if (targetEl) {
      const r = targetEl.getBoundingClientRect();
      heroRect = { x: r.left, y: r.top, width: r.width, height: r.height };
    }

    if (!isPlayingRef.current) {
      speakWord(cleaned, 'en-GB');
    }

    const contextLine = sentenceText
      ? `${sentenceText} (Cambridge IELTS Listening: ${section.title})`
      : `Cambridge IELTS Listening: ${section.title}`;
    const wordData = await lookupLyricTerm(cleaned, contextLine);
    openWordDetail(wordData, heroRect, 'drawer');
  };

  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const st = e.currentTarget.scrollTop;
    const delta = st - lastScrollTopRef.current;
    lastScrollTopRef.current = st;

    if (!isScrolledCompact && st > 64 && delta > 0) {
      setIsScrolledCompact(true);
    } else if (isScrolledCompact && st < 20) {
      setIsScrolledCompact(false);
    }
  };

  // Safe stop speech synthesis without triggering next sentence
  const stopPlayback = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (currentUtteranceRef.current) {
      currentUtteranceRef.current.onend = null;
      currentUtteranceRef.current.onerror = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Sync elapsedSeconds proportionally to paragraph index
  const syncElapsedToParagraph = (idx: number) => {
    const total = Math.max(1, section.scriptParagraphs.length);
    const synced = Math.round((idx / total) * section.durationSec);
    setElapsedSeconds(synced);
  };

  // Play audio for a specific paragraph via SpeechSynthesis
  const playParagraph = (idx: number, speed = playbackSpeed, loop = repeatSentence) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showToast('当前浏览器不支持原生语音朗读');
      return;
    }

    stopPlayback();

    if (idx < 0 || idx >= section.scriptParagraphs.length) {
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);

    const para = section.scriptParagraphs[idx];
    const utterance = new SpeechSynthesisUtterance(para.text);
    utterance.rate = speed;
    utterance.lang = 'en-GB';

    const voices = window.speechSynthesis.getVoices();
    const gbVoice = voices.find(
      v =>
        v.lang.startsWith('en-GB') ||
        v.name.includes('British') ||
        v.name.includes('UK') ||
        v.name.includes('Daniel') ||
        v.name.includes('Oliver') ||
        v.name.includes('Google UK English Female') ||
        v.name.includes('Google UK English Male')
    );
    if (gbVoice) {
      utterance.voice = gbVoice;
    }

    utterance.onend = () => {
      if (!isPlayingRef.current) return;

      if (loop) {
        syncElapsedToParagraph(idx);
        playParagraph(idx, speed, loop);
      } else if (idx + 1 < section.scriptParagraphs.length) {
        const nextIdx = idx + 1;
        setCurrentParagraphIdx(nextIdx);
        syncElapsedToParagraph(nextIdx);
        playParagraph(nextIdx, speed, loop);
      } else {
        isPlayingRef.current = false;
        setIsPlaying(false);
        setElapsedSeconds(section.durationSec);
      }
    };

    utterance.onerror = e => {
      if (e.error === 'canceled' || e.error === 'interrupted' || !isPlayingRef.current) {
        return;
      }
      isPlayingRef.current = false;
      setIsPlaying(false);
    };

    currentUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      playParagraph(currentParagraphIdx, playbackSpeed, repeatSentence);
    }
  };

  const handleJumpToParagraph = (idx: number) => {
    setCurrentParagraphIdx(idx);
    syncElapsedToParagraph(idx);
    playParagraph(idx, playbackSpeed, repeatSentence);
  };

  // Auto-scroll to active sentence when in transcript tab
  useEffect(() => {
    if (activeTab !== 'transcript') return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-listening-para="${currentParagraphIdx}"]`) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentParagraphIdx, activeTab]);

  const handleSpeedCycle = () => {
    const speeds = [0.8, 1.0, 1.2, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (isPlaying) {
      playParagraph(currentParagraphIdx, nextSpeed, repeatSentence);
    }
  };

  // Timer interval for elapsed time
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setElapsedSeconds(prev => Math.min(section.durationSec, prev + 1));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, section.durationSec]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, []);

  const handleAnswerChange = (qId: number, val: string) => {
    if (isExamSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleSubmitExam = () => {
    setIsExamSubmitted(true);
    stopPlayback();
  };

  const handleResetExam = () => {
    setUserAnswers({});
    setIsExamSubmitted(false);
    setElapsedSeconds(0);
    setCurrentParagraphIdx(0);
    stopPlayback();
  };

  // Compute Score
  const scoreStats = useMemo(() => {
    let correct = 0;
    section.questions.forEach(q => {
      const userAns = (userAnswers[q.id] || '').trim().toLowerCase();
      const correctAns = q.correctAnswer.trim().toLowerCase();
      if (userAns === correctAns) {
        correct++;
      }
    });
    const total = section.questions.length;
    const ratio = total > 0 ? correct / total : 0;
    let band = 'Band 6.0';
    if (ratio === 1) band = 'Band 9.0';
    else if (ratio >= 0.8) band = 'Band 8.5';
    else if (ratio >= 0.7) band = 'Band 8.0';
    else if (ratio >= 0.6) band = 'Band 7.5';
    else if (ratio >= 0.5) band = 'Band 7.0';
    else if (ratio > 0) band = 'Band 6.0';
    else band = 'Band 5.0';

    return { correct, total, ratio, band };
  }, [section.questions, userAnswers]);

  const answeredCount = Object.keys(userAnswers).filter(k => (userAnswers[Number(k)] || '').trim()).length;

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Structured Two-Layer Editorial Note Completion (Serif Stem Kicker on Line 1 + Natural Inline Flow Answer Slot on Line 2)
  const renderFormCompletionPrompt = (q: IELTSListeningQuestion) => {
    const userVal = userAnswers[q.id] || '';
    const isCorrect =
      isExamSubmitted &&
      userVal.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    const parts = q.prompt.split(/\[____\]/);

    const inputEl = (
      <input
        type="text"
        value={userVal}
        disabled={isExamSubmitted}
        placeholder="Answer"
        onChange={e => handleAnswerChange(q.id, e.target.value)}
        className={`inline-block w-20 sm:w-24 mx-1 px-1 py-0 text-[15px] leading-tight font-serif-luxury border-b-[1.5px] bg-transparent transition-colors focus:outline-none text-center align-baseline ${
          isExamSubmitted
            ? isCorrect
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300 font-bold'
              : 'border-rose-500 text-rose-700 dark:text-rose-300 line-through'
            : userVal.trim()
            ? 'border-[#516050] dark:border-[#8FB996] text-[#516050] dark:text-[#8FB996] font-semibold'
            : 'border-stone-400/85 dark:border-stone-600 focus:border-[#516050] dark:focus:border-[#8FB996] text-stone-900 dark:text-stone-100 placeholder:font-serif-luxury placeholder:italic placeholder:text-[13px] placeholder:text-stone-400/75'
        }`}
      />
    );

    if (parts.length === 1) {
      return (
        <div className="space-y-1.5">
          <p className="font-serif-luxury text-[15.5px] font-medium text-stone-800 dark:text-stone-100 leading-[1.45]">
            {q.prompt.replace(/:\s*$/, '')}
          </p>
          <div className="font-serif-luxury text-[15px] text-stone-600 dark:text-stone-300 leading-[1.75] block pt-0.5">
            {inputEl}
            {isExamSubmitted && !isCorrect && (
              <span className="inline-flex items-center ml-2 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-semibold align-baseline">
                ✓ {q.correctAnswer}
              </span>
            )}
          </div>
        </div>
      );
    }

    const rawBefore = parts[0] || '';
    const rawAfter = (parts[1] || '').trim();

    // Parse stem title vs inline prefix (split at ':' or trailing qualifier like 'up to' / 'approximately')
    let stemTitle = '';
    let inlinePrefix = '';

    const colonIdx = rawBefore.lastIndexOf(':');
    if (colonIdx !== -1) {
      stemTitle = rawBefore.slice(0, colonIdx).trim();
      inlinePrefix = rawBefore.slice(colonIdx + 1).trim();
    } else {
      const qualifierMatch = rawBefore.match(/^(.*?\S)\s+(up to|at least|approximately|around|about|over|under|by|in|for|from)\s*$/i);
      if (qualifierMatch && qualifierMatch[1].length > 12) {
        stemTitle = qualifierMatch[1].trim();
        inlinePrefix = qualifierMatch[2].trim();
      } else {
        stemTitle = rawBefore.trim();
      }
    }

    return (
      <div className="space-y-1">
        {stemTitle && (
          <p className="font-serif-luxury text-[15.5px] font-medium text-stone-800 dark:text-stone-100 leading-[1.45]">
            {stemTitle}
          </p>
        )}

        <div className="font-serif-luxury text-[15px] text-stone-600 dark:text-stone-300 leading-[1.75] block">
          {inlinePrefix && <span className="mr-0.5">{inlinePrefix}</span>}
          {inputEl}
          {rawAfter && <span className="ml-0.5">{rawAfter}</span>}

          {isExamSubmitted && !isCorrect && (
            <span className="inline-flex items-center ml-2 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono text-xs font-semibold align-baseline">
              ✓ {q.correctAnswer}
            </span>
          )}
        </div>
      </div>
    );
  };

  const totalParagraphs = Math.max(1, section.scriptParagraphs.length);
  const progressPercent = ((currentParagraphIdx + 1) / totalParagraphs) * 100;
  const firstQId = section.questions[0]?.id ?? 1;
  const lastQId = section.questions[section.questions.length - 1]?.id ?? section.questions.length;

  return (
    <div className="relative w-full h-full flex flex-col bg-transparent text-stone-900 dark:text-stone-100 overflow-hidden select-none">
      {/* Main Unified Scrollable Editorial Page (Matching IELTSHubView & Reading Passage View) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleContainerScroll}
        className="flex-1 overflow-y-auto no-scrollbar px-5 sm:px-7 pb-24 pt-1"
      >
        <div className="max-w-lg mx-auto space-y-4">
          {/* 1. Open Editorial Masthead & Academic Title (English Serif Primary + Single-Line Chinese Guide) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-mono tabular-nums text-stone-600 dark:text-stone-300 min-w-0">
                <span className="font-serif-luxury italic text-[15px] font-bold tracking-normal whitespace-nowrap shrink-0 text-[#516050] dark:text-[#8FB996]">
                  {section.cambridgeBook
                    .replace(/^Cambridge\s+(\d+)$/i, 'Vol. $1')
                    .replace(/^(\d{4})\s*考场真题$/, 'Vol. $1')
                    .replace(/^(\d{4})\s*Recall$/i, 'Vol. $1')
                    .replace(/^(Cambridge\s+IELTS\s+Academic\s+Special|IELTS\s+Academic\s+Reading\s+Special)$/i, 'Vol. Special')}
                </span>
                <span aria-hidden="true" className="opacity-40 shrink-0">·</span>
                <span className="whitespace-nowrap shrink-0">T{section.testNum} S{section.sectionNum}</span>
                <span aria-hidden="true" className="opacity-40 shrink-0">·</span>
                <span className="font-sans-ui font-medium text-[#516050] dark:text-[#8FB996] whitespace-nowrap truncate">
                  Part {section.sectionNum} 听力
                </span>
              </div>
              <span className="font-mono tabular-nums text-[11px] text-stone-500 dark:text-stone-400 font-medium whitespace-nowrap shrink-0">
                {section.bandDifficulty}
              </span>
            </div>

            <h1 className="font-serif-luxury text-[19px] sm:text-[21px] font-bold text-stone-900 dark:text-stone-100 leading-[1.3] tracking-tight pt-0.5 text-balance">
              {bilingualMeta.titleEn || section.title}
            </h1>

            {bilingualMeta.titleZh && bilingualMeta.titleZh !== (bilingualMeta.titleEn || section.title) && (
              <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                {bilingualMeta.titleZh}
              </p>
            )}
          </div>

          {/* 2. Sticky Precision Audio Deck + Collapsible Editorial Tabs (Silky Scroll Morphing) */}
          <div
            className={`sticky top-0 z-20 -mx-5 sm:-mx-7 px-5 sm:px-7 bg-[#FAF7F2]/95 dark:bg-[#0C1017]/95 backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isScrolledCompact ? 'py-1.5' : 'pt-1.5 pb-0'
            }`}
          >
            {/* Audio Console: Morphs from Two-Tier Deck into Single-Line Mini Capsule on Scroll */}
            <div
              className={`bg-[#F3EFE6]/90 dark:bg-[#141B26]/90 border border-stone-900/[0.06] dark:border-white/[0.07] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isScrolledCompact
                  ? 'px-3 py-1.5 rounded-[20px] shadow-2xs'
                  : 'px-4 py-3 rounded-[16px]'
              }`}
            >
              {/* Tier 1: Precision Scrubber Track (Morphs to include Play/Pause + Sentence Counter when Compact) */}
              <div className="flex items-center">
                {/* Compact Play/Pause Button (Slides & Scales in smoothly when scrolled down) */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center shrink-0 ${
                    isScrolledCompact
                      ? 'w-7 mr-2.5 opacity-100 scale-100'
                      : 'w-0 mr-0 opacity-0 scale-75 pointer-events-none'
                  }`}
                >
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="w-7 h-7 rounded-full bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#8FB996] text-white dark:text-stone-950 flex items-center justify-center shrink-0 transition-transform active:scale-90 cursor-pointer shadow-2xs focus:outline-none"
                    title={isPlaying ? '暂停播放' : '播放听力音频'}
                  >
                    {isPlaying ? (
                      <Pause className="w-3 h-3 fill-current" />
                    ) : (
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    )}
                  </button>
                </div>

                <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 whitespace-nowrap shrink-0 w-8 text-left">
                  {formatSec(elapsedSeconds)}
                </span>

                <div
                  onClick={e => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const targetIdx = Math.min(totalParagraphs - 1, Math.floor(ratio * totalParagraphs));
                    handleJumpToParagraph(targetIdx);
                  }}
                  className="flex-1 mx-2.5 h-4 flex items-center cursor-pointer group"
                  title="点击跳转对应句子"
                >
                  <div className="w-full h-[3px] rounded-full bg-stone-300/85 dark:bg-white/10 relative flex items-center">
                    <div
                      className="h-full bg-[#516050] dark:bg-[#8FB996] transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                    <div
                      className="w-2.5 h-2.5 rounded-full bg-[#516050] dark:bg-[#8FB996] shadow-2xs -ml-1.5 transition-transform group-hover:scale-125"
                    />
                  </div>
                </div>

                <span className="text-[11px] font-mono tabular-nums text-stone-400 dark:text-stone-500 whitespace-nowrap shrink-0 w-8 text-right">
                  {formatSec(section.durationSec)}
                </span>

                {/* Compact Sentence & Speed Indicator (Glides in on the right when scrolled down) */}
                <div
                  className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center shrink-0 ${
                    isScrolledCompact
                      ? 'max-w-[110px] ml-2.5 opacity-100'
                      : 'max-w-0 ml-0 opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="flex items-center gap-2 pl-2 border-l border-stone-900/10 dark:border-white/10 whitespace-nowrap">
                    <span className="text-[10.5px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
                      {String(currentParagraphIdx + 1).padStart(2, '0')}/{String(totalParagraphs).padStart(2, '0')}句
                    </span>
                    <button
                      type="button"
                      onClick={handleSpeedCycle}
                      className="text-[11px] font-mono tabular-nums font-semibold text-[#516050] dark:text-[#8FB996] hover:opacity-80 transition-opacity cursor-pointer"
                      title="切换倍速"
                    >
                      {playbackSpeed.toFixed(1)}×
                    </button>
                  </div>
                </div>
              </div>

              {/* Tier 2: Full Transport Deck (Smoothly folds up when scrolled down) */}
              <div
                className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isScrolledCompact
                    ? 'grid-rows-[0fr] opacity-0 pt-0 pointer-events-none'
                    : 'grid-rows-[1fr] opacity-100 pt-2'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex items-center justify-between pt-0.5">
                    {/* Left: Clean Unboxed Sentence Counter */}
                    <div className="w-20 flex items-center">
                      <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 whitespace-nowrap">
                        {String(currentParagraphIdx + 1).padStart(2, '0')} / {String(totalParagraphs).padStart(2, '0')} 句
                      </span>
                    </div>

                    {/* Center: Tactile Transport Controls */}
                    <div className="flex items-center justify-center gap-5">
                      <button
                        type="button"
                        onClick={() => handleJumpToParagraph(Math.max(0, currentParagraphIdx - 1))}
                        className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors cursor-pointer active:scale-90"
                        title="上一句"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={handleTogglePlay}
                        className="w-10 h-10 rounded-full bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#8FB996] text-white dark:text-stone-950 flex items-center justify-center shrink-0 transition-transform active:scale-92 cursor-pointer shadow-xs focus:outline-none"
                        title={isPlaying ? '暂停播放' : '播放听力音频'}
                      >
                        {isPlaying ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleJumpToParagraph(Math.min(section.scriptParagraphs.length - 1, currentParagraphIdx + 1))}
                        className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors cursor-pointer active:scale-90"
                        title="下一句"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Right: Unboxed Speed & Loop */}
                    <div className="w-20 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={handleSpeedCycle}
                        className="text-[11.5px] font-mono tabular-nums font-semibold text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                        title="切换倍速"
                      >
                        {playbackSpeed.toFixed(1)}×
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const next = !repeatSentence;
                          setRepeatSentence(next);
                          showToast(next ? '已开启单句循环精听' : '已关闭单句循环');
                        }}
                        className={`p-1 transition-colors cursor-pointer shrink-0 ${
                          repeatSentence
                            ? 'text-[#516050] dark:text-[#8FB996]'
                            : 'text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-300'
                        }`}
                        title="单句复读循环"
                      >
                        <Repeat className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Open Editorial Tab Bar (Smoothly folds up & omits when scrolled down) */}
            <div
              className={`grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isScrolledCompact
                  ? 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                  : 'grid-rows-[1fr] opacity-100 mt-3'
              }`}
            >
              <div className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-stone-900/12 dark:border-white/12 pb-2">
                  <div className="flex items-center gap-6">
                    <button
                      type="button"
                      onClick={() => setActiveTab('exam')}
                      className={`relative py-1 text-sm transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'exam'
                          ? 'text-stone-900 dark:text-white font-bold'
                          : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
                      }`}
                    >
                      <span>听力做题</span>
                      <span className="font-mono tabular-nums text-[11px] opacity-70">
                        {answeredCount}/{section.questions.length}
                      </span>
                      <span
                        className={`absolute left-0 right-0 -bottom-[9px] h-[2px] bg-stone-900 dark:bg-white rounded-full transition-all duration-300 ${
                          activeTab === 'exam' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50'
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('transcript')}
                      className={`relative py-1 text-sm transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        activeTab === 'transcript'
                          ? 'text-stone-900 dark:text-white font-bold'
                          : 'text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 font-medium'
                      }`}
                    >
                      <span>录音原文</span>
                      <span className="font-mono tabular-nums text-[11px] opacity-70">
                        {totalParagraphs}句
                      </span>
                      <span
                        className={`absolute left-0 right-0 -bottom-[9px] h-[2px] bg-stone-900 dark:bg-white rounded-full transition-all duration-300 ${
                          activeTab === 'transcript' ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50'
                        }`}
                      />
                    </button>
                  </div>

                  <span className="text-[11px] font-mono tabular-nums text-stone-400 dark:text-stone-500">
                    {activeTab === 'exam' ? `Questions ${firstQId}–${lastQId}` : '点序号跳播 · 点词查释义'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Open Archival Stage Content (Directly on #FAF7F2 Paper — Zero Outer Box Clutter) */}
          <AnimatePresence mode="wait" initial={false}>
            {activeTab === 'exam' ? (
              /* ================= VIEW A: OPEN EDITORIAL WORKSHEET ================= */
              <motion.div
                key="listening-tab-exam"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                <div className="divide-y divide-stone-900/[0.06] dark:divide-white/[0.06]">
                  {section.questions.map((q, qIdx) => {
                    const userVal = userAnswers[q.id] || '';
                    const isCorrect =
                      isExamSubmitted &&
                      userVal.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

                    return (
                      <div
                        key={`listening-q-${q.id}-${qIdx}`}
                        className="py-4 first:pt-1 flex items-start gap-3.5"
                      >
                        {/* Left Margin: Editorial Serif Question Numeral (Matching IELTSHubView 01, 02, 03) */}
                        <div className="w-8 shrink-0 pt-0.5 flex flex-col items-start select-none">
                          <span
                            className={`font-serif-luxury text-lg font-bold leading-none tabular-nums ${
                              isExamSubmitted
                                ? isCorrect
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                                : userVal.trim()
                                ? 'text-[#516050] dark:text-[#8FB996]'
                                : 'text-stone-400 dark:text-stone-500'
                            }`}
                          >
                            {q.id}
                          </span>
                        </div>

                        {/* Right Column: Natural Continuous Sentence + Inline Blank */}
                        <div className="flex-1 min-w-0 space-y-2.5">
                          {q.type === 'FORM_COMPLETION' || q.type === 'TABLE_COMPLETION' ? (
                            renderFormCompletionPrompt(q)
                          ) : (
                            <div className="space-y-2.5">
                              <p className="font-serif-luxury text-[15.5px] sm:text-[16px] text-stone-900 dark:text-stone-100 font-medium leading-relaxed">
                                {q.prompt}
                              </p>

                              <div className="space-y-1.5 pt-0.5">
                                {q.options?.map((opt, optIdx) => {
                                  const optKey = opt.charAt(0);
                                  const isSelected = userVal === optKey;
                                  const isCorrectOpt =
                                    isExamSubmitted &&
                                    optKey.toLowerCase() === q.correctAnswer.trim().toLowerCase();

                                  return (
                                    <button
                                      key={`listening-opt-${q.id}-${optKey}-${optIdx}`}
                                      type="button"
                                      disabled={isExamSubmitted}
                                      onClick={() => handleAnswerChange(q.id, optKey)}
                                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer flex items-center justify-between gap-2 border ${
                                        isExamSubmitted && isCorrectOpt
                                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                                          : isSelected
                                          ? 'bg-[#516050]/10 dark:bg-[#8FB996]/15 border-[#516050]/35 dark:border-[#8FB996]/40 text-stone-900 dark:text-white font-semibold'
                                          : 'bg-white/60 dark:bg-white/[0.02] border-stone-900/[0.06] dark:border-white/[0.06] text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-white/[0.05]'
                                      }`}
                                    >
                                      <span className="leading-snug">{opt}</span>
                                      {isSelected && (
                                        <Check className="w-3.5 h-3.5 text-[#516050] dark:text-[#8FB996] shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Post-Submission Explanation & Refined Acoustic Clue Card */}
                          {isExamSubmitted && (() => {
                            const clueIdx = section.scriptParagraphs.findIndex(
                              p => p.clueForQuestionId === q.id
                            );
                            const cluePara = clueIdx !== -1 ? section.scriptParagraphs[clueIdx] : null;
                            const isCluePlaying = isPlaying && currentParagraphIdx === clueIdx;

                            return (
                              <div className="mt-3 p-3.5 rounded-2xl bg-[#F3EFE6]/75 dark:bg-white/[0.04] border border-stone-900/[0.06] dark:border-white/[0.07] space-y-2.5">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="font-sans-ui text-xs font-semibold text-stone-800 dark:text-stone-200 tracking-wide">
                                    考点精析
                                  </span>

                                  {clueIdx !== -1 && (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (isCluePlaying) {
                                            stopPlayback();
                                          } else {
                                            handleJumpToParagraph(clueIdx);
                                          }
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-sans-ui font-medium transition-all cursor-pointer active:scale-95 border ${
                                          isCluePlaying
                                            ? 'bg-[#516050] text-white border-[#516050] dark:bg-[#8FB996] dark:text-stone-950 dark:border-[#8FB996] shadow-2xs'
                                            : 'bg-white/90 hover:bg-white dark:bg-white/[0.07] dark:hover:bg-white/[0.12] text-[#516050] dark:text-[#8FB996] border-[#516050]/20 dark:border-[#8FB996]/25 shadow-2xs'
                                        }`}
                                        title={isCluePlaying ? '点击暂停原音朗读' : '点击播放该题对应的听力原句'}
                                      >
                                        {isCluePlaying ? (
                                          <Pause className="w-3 h-3 fill-current shrink-0" />
                                        ) : (
                                          <Volume2 className="w-3.5 h-3.5 shrink-0" />
                                        )}
                                        <span>{isCluePlaying ? '正在播放' : '原音定位'}</span>
                                        <span aria-hidden="true" className="opacity-45">·</span>
                                        <span>
                                          第 <strong className="font-mono tabular-nums font-semibold">{String(clueIdx + 1).padStart(2, '0')}</strong> 句
                                        </span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCurrentParagraphIdx(clueIdx);
                                          syncElapsedToParagraph(clueIdx);
                                          setActiveTab('transcript');
                                        }}
                                        className="px-2 py-1 rounded-full text-[11px] font-sans-ui font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-900/[0.05] dark:hover:bg-white/[0.07] transition-colors cursor-pointer"
                                        title="在录音原文中查看上下文"
                                      >
                                        看原文
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {cluePara && (
                                  <div
                                    onClick={() => handleJumpToParagraph(clueIdx)}
                                    className={`px-3 py-2 rounded-xl border transition-colors cursor-pointer ${
                                      isCluePlaying
                                        ? 'bg-[#516050]/[0.08] dark:bg-[#8FB996]/[0.12] border-[#516050]/25 dark:border-[#8FB996]/30'
                                        : 'bg-white/65 dark:bg-white/[0.025] border-stone-900/[0.05] dark:border-white/[0.05] hover:bg-white/90 dark:hover:bg-white/[0.05]'
                                    }`}
                                    title="轻触播放该原句"
                                  >
                                    <p className="font-serif-luxury italic text-[13.5px] text-stone-700 dark:text-stone-200 leading-relaxed">
                                      {cluePara.speaker && (
                                        <span className="not-italic font-sans-ui text-[10.5px] font-semibold uppercase tracking-wider text-[#516050] dark:text-[#8FB996] mr-1.5">
                                          {cluePara.speaker}:
                                        </span>
                                      )}
                                      “{cluePara.text}”
                                    </p>
                                  </div>
                                )}

                                <p className="font-sans-ui text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                                  {q.explanation}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submission & Assessment Footer */}
                <div className="pt-2">
                  {!isExamSubmitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitExam}
                      className="w-full py-3.5 rounded-2xl bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#8FB996] text-white dark:text-stone-950 font-semibold text-xs tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-[0.99]"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>
                        交卷并核对解析 ({answeredCount}/{section.questions.length})
                      </span>
                    </button>
                  ) : (
                    <div className="p-5 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-stone-900/[0.08] dark:border-white/[0.08] space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase tracking-[0.18em] font-mono">
                            LISTENING ASSESSMENT
                          </span>
                          <h4 className="text-xl sm:text-2xl font-serif-luxury font-bold text-stone-900 dark:text-stone-100 tabular-nums mt-0.5">
                            {scoreStats.band}{' '}
                            <span className="text-sm font-mono font-normal text-stone-500">
                              · {scoreStats.correct}/{scoreStats.total} 正确
                            </span>
                          </h4>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTab('transcript')}
                          className="px-3.5 py-2 rounded-xl bg-[#516050] text-white dark:bg-[#8FB996] dark:text-stone-950 text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer whitespace-nowrap"
                        >
                          对照原文精听
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleResetExam}
                        className="w-full py-2.5 rounded-xl bg-stone-900/[0.05] dark:bg-white/[0.06] text-stone-700 dark:text-stone-300 font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-stone-900/[0.09] dark:hover:bg-white/[0.1] cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>重新作答本篇</span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* ================= VIEW B: OPEN EDITORIAL TRANSCRIPT ================= */
              <motion.div
                key="listening-tab-transcript"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-5"
              >
                <div className="divide-y divide-stone-900/[0.06] dark:divide-white/[0.06]">
                  {section.scriptParagraphs.map((para, idx) => {
                    const isCurrent = currentParagraphIdx === idx;
                    const hasClue = Boolean(para.clueForQuestionId);
                    const rawWords = para.text.trim().split(/\s+/);

                    return (
                      <div
                        key={`script-para-${idx}`}
                        data-listening-para={idx}
                        onClick={() => handleJumpToParagraph(idx)}
                        className={`py-4 px-3 -mx-3 rounded-2xl transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                          isCurrent
                            ? 'bg-[#516050]/[0.07] dark:bg-[#8FB996]/[0.1]'
                            : 'hover:bg-stone-900/[0.025] dark:hover:bg-white/[0.025]'
                        }`}
                      >
                        {/* Left Margin: Sentence Numeral (Click to jump audio playback) */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleJumpToParagraph(idx);
                          }}
                          title="点击从本句开始播放"
                          className="w-8 shrink-0 pt-0.5 flex flex-col items-start select-none cursor-pointer group/num focus:outline-none"
                        >
                          <span
                            className={`font-serif-luxury text-lg font-bold leading-none tabular-nums transition-colors ${
                              isCurrent
                                ? 'text-[#516050] dark:text-[#8FB996]'
                                : 'text-stone-400 dark:text-stone-600 group-hover/num:text-[#516050] dark:group-hover/num:text-[#8FB996]'
                            }`}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                        </button>

                        {/* Right Column: Speaker + Interactive Word-by-Word Sentence Text */}
                        <div className="flex-1 min-w-0 space-y-1">
                          {(para.speaker || hasClue) && (
                            <div className="flex items-center justify-between gap-2 text-[11px]">
                              <span
                                className={`font-mono tabular-nums font-semibold uppercase tracking-wider ${
                                  isCurrent
                                    ? 'text-[#516050] dark:text-[#8FB996]'
                                    : 'text-stone-400 dark:text-stone-500'
                                }`}
                              >
                                {para.speaker || `SENTENCE ${idx + 1}`}
                              </span>

                              {hasClue && (
                                <span className="font-sans-ui text-[#516050] dark:text-[#8FB996] font-semibold">
                                  第 <strong className="font-mono tabular-nums">{para.clueForQuestionId}</strong> 题考点
                                </span>
                              )}
                            </div>
                          )}

                          <p
                            className={`font-serif-luxury text-[15.5px] sm:text-[16px] leading-[1.75] transition-colors ${
                              isCurrent
                                ? 'text-stone-950 dark:text-white font-semibold'
                                : 'text-stone-700 dark:text-stone-300'
                            }`}
                          >
                            {rawWords.map((rawToken, wIdx) => {
                              const match = rawToken.match(/^([^a-zA-Z0-9]*)([\w'-]+)([^a-zA-Z0-9]*)$/);
                              const leading = match ? match[1] || '' : '';
                              const word = match ? match[2] || rawToken : rawToken;
                              const trailing = match ? match[3] || '' : '';
                              const clean = cleanWordText(word).toLowerCase();
                              const isSaved = Boolean(clean && savedWordsSet.has(clean));

                              return (
                                <React.Fragment key={`trans-tok-${idx}-${wIdx}`}>
                                  {leading && <span>{leading}</span>}
                                  <span
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleTranscriptWordClick(word, para.text, e.currentTarget);
                                    }}
                                    className={`relative inline-block px-[2px] py-[1px] -mx-[1px] rounded-[5px] transition-colors duration-100 cursor-pointer hover:bg-[#516050]/12 dark:hover:bg-[#8FB996]/18 hover:text-[#516050] dark:hover:text-[#8FB996] ${
                                      isSaved
                                        ? 'underline decoration-[#516050]/60 dark:decoration-[#8FB996]/70 underline-offset-[3px] decoration-[1.5px] font-medium text-stone-900 dark:text-stone-100'
                                        : ''
                                    }`}
                                  >
                                    {word}
                                  </span>
                                  {trailing && <span>{trailing}</span>}
                                  {wIdx < rawWords.length - 1 && ' '}
                                </React.Fragment>
                              );
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Editorial Key Vocabulary Index */}
                {section.keyVocab && section.keyVocab.length > 0 && (
                  <div className="pt-4 border-t border-stone-900/12 dark:border-white/12 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider text-stone-400 dark:text-stone-500 uppercase">
                        核心听力词汇 · Key Vocabulary
                      </span>
                      <span className="text-[11px] text-stone-400">点击查词与发音</span>
                    </div>
                    <div className="flex items-center gap-x-3.5 gap-y-2 flex-wrap pt-0.5">
                      {section.keyVocab.map((w, idx) => (
                        <React.Fragment key={`listening-vocab-${w}-${idx}`}>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleTranscriptWordClick(
                                w,
                                `Key vocabulary in "${section.title}"`,
                                e.currentTarget
                              );
                            }}
                            className="font-serif-luxury text-[15.5px] font-medium text-stone-800 dark:text-stone-200 hover:text-[#516050] dark:hover:text-[#8FB996] underline decoration-stone-300 dark:decoration-stone-700 underline-offset-4 cursor-pointer transition-colors"
                          >
                            {w}
                          </button>
                          {idx < section.keyVocab.length - 1 && (
                            <span className="text-stone-300 dark:text-stone-700 select-none">·</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll-height compensation spacer to prevent scrollTop clamping when sticky header collapses */}
          <div
            aria-hidden="true"
            className={`transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isScrolledCompact ? 'h-24' : 'h-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
