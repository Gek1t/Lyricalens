import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { IELTSTestRecord } from '../../types';
import { speakWord } from '../../utils/audioEngine';
import { lookupWord } from '../../utils/lyricDictionary';
import { db } from '../../db';
import { useAppStore } from '../../store/useAppStore';
import { AmbientBackground } from '../AmbientBackground';
import {
  ChevronLeft,
  ChevronDown,
  CheckCircle2,
  XCircle,
  BookOpen,
  Volume2,
  Sparkles,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

interface ArchiveReviewModalProps {
  record: IELTSTestRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onRetest: (record: IELTSTestRecord) => void;
}

export const ArchiveReviewModal: React.FC<ArchiveReviewModalProps> = ({
  record,
  isOpen,
  onClose,
  onRetest
}) => {
  const openWordDetail = useAppStore(s => s.openWordDetail);
  const words = useLiveQuery(() => db.words.toArray(), []) || [];

  const [isPassageExpanded, setIsPassageExpanded] = useState(false);
  const [questionFilter, setQuestionFilter] = useState<'ALL' | 'MISTAKES'>('ALL');

  const wordMasteryMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of words) {
      if (w.word) {
        map.set(w.word.toLowerCase().trim(), w.masteryLevel ?? 0);
      }
    }
    return map;
  }, [words]);

  if (!isOpen || !record) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const getBandBadgeClass = (band: number) => {
    if (band >= 8.0) {
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20';
    }
    if (band >= 7.0) {
      return 'bg-stone-900/[0.05] dark:bg-white/[0.08] text-stone-800 dark:text-stone-100 border-stone-900/[0.06] dark:border-white/[0.08]';
    }
    return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
  };

  const getWordChipStyle = (wordText: string) => {
    const level = wordMasteryMap.get(wordText.toLowerCase().trim()) ?? 0;
    if (level >= 3) {
      return {
        level,
        label: '已掌握',
        className:
          'bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
      };
    }
    return {
      level,
      label: level >= 1 ? '学习中' : '点击收录',
      className:
        'bg-sky-500/10 hover:bg-sky-500/20 dark:bg-sky-500/15 dark:hover:bg-sky-500/25 text-sky-700 dark:text-sky-300 border-sky-500/20'
    };
  };

  const handleWordClick = async (wordText: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const cleaned = wordText.replace(/[^a-zA-Z-]/g, '').trim();
    if (!cleaned) return;

    let heroRect: { x: number; y: number; width: number; height: number } | null = null;
    if (e.currentTarget) {
      const r = e.currentTarget.getBoundingClientRect();
      heroRect = { x: r.left, y: r.top, width: r.width, height: r.height };
    }

    try {
      let wordData = await db.words.where('word').equalsIgnoreCase(cleaned).first();
      if (!wordData) {
        wordData = await lookupWord(cleaned);
      }
      openWordDetail(wordData, heroRect, 'drawer');
      speakWord(cleaned, 'en-GB');
    } catch (err) {
      console.warn('Failed to load word detail:', err);
    }
  };

  const mistakesCount = Math.max(0, record.totalQuestions - record.correctCount);
  const isRecordOvertime = Boolean(
    record.isOvertime || (record.standardTimeSec && record.timeSpentSec > record.standardTimeSec)
  );

  // Collect all key words (conqueredWords + per-question targetVocab) for passage highlighting
  const highlightVocabSet = new Set<string>(
    [
      ...(record.conqueredWords || []),
      ...(record.questions || []).map(q => q?.targetVocab || '').filter(Boolean)
    ].map(w => w.toLowerCase().trim())
  );

  const paragraphs = (record.passageText || '')
    .split(/\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  const allQuestionsWithIndex = (record.questions || [])
    .filter(Boolean)
    .map((q, idx) => {
      const userAns = q?.id ? record.answers?.[q.id] : undefined;
      const isCorrect = userAns === q?.correctAnswer;
      return { q, originalNumber: idx + 1, userAns, isCorrect };
    });

  const displayedQuestions =
    questionFilter === 'MISTAKES'
      ? allQuestionsWithIndex.filter(item => !item.isCorrect)
      : allQuestionsWithIndex;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0.9 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0.9 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.85 }}
      className="absolute inset-0 z-50 w-full h-full flex flex-col bg-[#FAF8F5] dark:bg-[#0B0F17] text-stone-900 dark:text-stone-100 overflow-hidden pointer-events-auto select-none transition-colors duration-700"
    >
      {/* Ambient Breathing Background matching Personal Hub */}
      <AmbientBackground intensity={0.72} />

      {/* Top Header Navigation Bar */}
      <div className="relative z-10 px-5 pt-7 pb-3 flex items-center justify-between border-b border-stone-900/[0.05] dark:border-white/[0.06] bg-white/30 dark:bg-black/20 backdrop-blur-xl flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 -ml-2 px-2.5 py-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-900/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer text-xs font-semibold whitespace-nowrap"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>返回档案</span>
          </button>
          <span className="text-stone-300 dark:text-stone-700">|</span>
          <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 whitespace-nowrap">
            模考深度解析
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-mono text-stone-400 tabular-nums whitespace-nowrap">
            {formatDate(record.timestamp)}
          </span>
          <div
            className={`inline-flex items-baseline gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold border tabular-nums whitespace-nowrap shrink-0 ${getBandBadgeClass(
              record.bandScore
            )}`}
          >
            <span className="text-[10px] font-sans font-medium opacity-75">Band</span>
            <span>{record.bandScore.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Full-bleed Scrollable Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4.5 pt-3.5 pb-6 space-y-3.5 no-scrollbar">
        {/* 1. Unified Hero Overview Card */}
        <div className="p-4.5 rounded-3xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] shadow-sm space-y-3.5">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 dark:text-stone-500 block mb-1 font-medium">
              {record.passageSubtitle || 'IELTS ACADEMIC READING'}
            </span>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-50 leading-snug">
              {record.passageTitle}
            </h2>
          </div>

          {/* 3-Column Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-900/[0.05] dark:border-white/[0.06] text-center">
            <div className="py-1">
              <span className="text-[10px] font-sans text-stone-400 block mb-0.5">正确率</span>
              <p className="text-base font-mono font-bold text-stone-800 dark:text-stone-100 tabular-nums">
                {record.correctCount} / {record.totalQuestions}
              </p>
            </div>
            <div className="py-1 border-x border-stone-900/[0.05] dark:border-white/[0.06]">
              <span className="text-[10px] font-sans text-stone-400 block mb-0.5">答题耗时</span>
              <p className="text-xs font-mono font-semibold text-stone-700 dark:text-stone-300 mt-1 tabular-nums">
                {formatDuration(record.timeSpentSec)}{' '}
                <span
                  className={`text-[10px] font-sans ${
                    isRecordOvertime
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  · {isRecordOvertime ? '超时' : '达标'}
                </span>
              </p>
            </div>
            <div className="py-1">
              <span className="text-[10px] font-sans text-stone-400 block mb-0.5">评估状态</span>
              <p
                className={`text-[11px] font-sans font-semibold mt-0.5 flex items-center justify-center gap-1 ${
                  mistakesCount > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {mistakesCount > 0 ? (
                  <>
                    <AlertCircle className="w-3 h-3" />
                    <span>{mistakesCount} 题待巩固</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>全部通过</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Key Words Micro Chips Row with Mastery State */}
          {record.conqueredWords && record.conqueredWords.length > 0 && (
            <div className="pt-2 border-t border-stone-900/[0.05] dark:border-white/[0.06] flex items-center flex-wrap gap-1.5">
              <span className="text-[10px] font-sans text-stone-400 dark:text-stone-500 mr-0.5 flex items-center gap-1">
                <span>真题考点词:</span>
              </span>
              {record.conqueredWords.map((word, i) => {
                const chip = getWordChipStyle(word);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={e => handleWordClick(word, e)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-medium border active:scale-95 transition-all cursor-pointer ${chip.className}`}
                    title={`${chip.label} · 点击查词发音`}
                  >
                    {chip.level >= 3 && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                    <span>{word}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. Collapsible Passage Reference Panel (原文对照复盘) */}
        {paragraphs.length > 0 && (
          <div className="rounded-3xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] shadow-sm overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsPassageExpanded(prev => !prev)}
              className="w-full px-4.5 py-3.5 flex items-center justify-between text-left hover:bg-stone-900/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  真题阅读原文对照
                </span>
                <span className="text-[10px] font-mono text-stone-400 dark:text-stone-500">
                  · 共 {paragraphs.length} 段 (支持点词发音)
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                <span>{isPassageExpanded ? '收起原文' : '展开对照'}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isPassageExpanded ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            <AnimatePresence initial={false}>
              {isPassageExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div className="px-4.5 pb-4 pt-2 border-t border-stone-900/[0.05] dark:border-white/[0.06] space-y-3 max-h-72 overflow-y-auto no-scrollbar select-text">
                    {paragraphs.map((para, pIdx) => (
                      <div key={pIdx} className="text-xs leading-relaxed text-stone-700 dark:text-stone-300 font-serif">
                        <span className="inline-block font-mono text-[10px] font-bold text-stone-400 dark:text-stone-500 mr-2 select-none">
                          P{pIdx + 1}
                        </span>
                        {para.split(/(\s+)/).map((token, tIdx) => {
                          const cleanToken = token.replace(/[^a-zA-Z-]/g, '').toLowerCase();
                          const isKeyVocab = cleanToken.length > 2 && highlightVocabSet.has(cleanToken);
                          if (isKeyVocab) {
                            return (
                              <button
                                key={tIdx}
                                type="button"
                                onClick={e => handleWordClick(cleanToken, e)}
                                className="inline px-1 py-0.2 rounded bg-sky-500/15 text-sky-700 dark:text-sky-300 font-medium underline decoration-sky-500/40 underline-offset-2 hover:bg-sky-500/25 transition-colors cursor-pointer"
                                title="考点词 · 点击查词发音"
                              >
                                {token}
                              </button>
                            );
                          }
                          return <React.Fragment key={tIdx}>{token}</React.Fragment>;
                        })}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 3. Question Breakdown & Mistakes Review */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between px-1 gap-2">
            <h3 className="text-xs font-semibold text-stone-800 dark:text-stone-200">
              题目作答与考点深度解析
            </h3>

            {mistakesCount > 0 ? (
              <div className="flex items-center p-0.5 rounded-xl bg-stone-200/60 dark:bg-white/[0.06] border border-stone-900/[0.05] dark:border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setQuestionFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap tabular-nums ${
                    questionFilter === 'ALL'
                      ? 'bg-white dark:bg-[#18212D] text-stone-900 dark:text-white shadow-xs font-semibold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                  }`}
                >
                  全部 ({allQuestionsWithIndex.length})
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionFilter('MISTAKES')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap tabular-nums ${
                    questionFilter === 'MISTAKES'
                      ? 'bg-rose-500 text-white shadow-xs font-semibold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
                  }`}
                >
                  只看错题 ({mistakesCount})
                </button>
              </div>
            ) : (
              <span className="text-[10px] font-mono text-stone-400 tabular-nums">
                共 {allQuestionsWithIndex.length} 题 · 全部正确
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {displayedQuestions.map(({ q, originalNumber, userAns, isCorrect }) => {
              const targetWord = q?.targetVocab?.trim();
              const targetChip = targetWord ? getWordChipStyle(targetWord) : null;

              return (
                <div
                  key={q?.id || `q-${originalNumber}`}
                  className={`p-4 rounded-3xl border transition-all shadow-sm space-y-2.5 ${
                    isCorrect
                      ? 'bg-white/50 dark:bg-white/[0.03] border-stone-900/[0.06] dark:border-white/[0.07]'
                      : 'bg-rose-500/[0.04] dark:bg-rose-500/[0.08] border-rose-500/25'
                  }`}
                >
                  {/* Top Question Tag & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 tabular-nums">
                      Q{originalNumber} · {q?.type || 'TFNG'}
                    </span>

                    <div className="flex items-center gap-1">
                      {isCorrect ? (
                        <span className="text-[11px] font-sans text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>正确</span>
                        </span>
                      ) : (
                        <span className="text-[11px] font-sans text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>作答有误</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <p className="text-xs font-sans text-stone-800 dark:text-stone-200 font-medium leading-relaxed">
                    {q?.prompt || ''}
                  </p>

                  {/* Streamlined Answer Comparison */}
                  <div className="flex items-center flex-wrap gap-2 text-xs font-mono py-1.5 px-2.5 rounded-xl bg-stone-100/60 dark:bg-stone-900/50 border border-stone-900/[0.04] dark:border-white/5">
                    {isCorrect ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-stone-400 font-sans">你的作答:</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[11px]">
                          {userAns || '未作答'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center flex-wrap gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-stone-400 font-sans">你的作答:</span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold font-mono text-[11px]">
                            {userAns || '未作答'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-stone-400 font-sans">标准答案:</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[11px]">
                            {q?.correctAnswer || 'TRUE'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Explanation Card */}
                  <div className="p-2.5 rounded-2xl bg-stone-900/[0.03] dark:bg-white/[0.03] border border-stone-900/[0.05] dark:border-white/[0.05] text-[11px] font-sans text-stone-600 dark:text-stone-300 leading-relaxed space-y-2">
                    <div>
                      <span className="font-semibold text-stone-800 dark:text-stone-100 mr-1">
                        考点解析：
                      </span>
                      {q?.explanation || '暂无解析'}
                    </div>

                    {/* Linked Per-Question Target Vocab */}
                    {targetWord && targetChip && (
                      <div className="pt-1.5 border-t border-stone-900/[0.05] dark:border-white/[0.05] flex items-center justify-between gap-2">
                        <span className="text-[10px] text-stone-400 dark:text-stone-500">
                          本题核心考点词
                        </span>
                        <button
                          type="button"
                          onClick={e => handleWordClick(targetWord, e)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-semibold border active:scale-95 transition-all cursor-pointer ${targetChip.className}`}
                          title={`${targetChip.label} · 点击查词发音`}
                        >
                          <Volume2 className="w-3 h-3 shrink-0" />
                          <span>{targetWord}</span>
                          <span className="text-[9px] font-sans opacity-75">
                            ({targetChip.label})
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Pinned Action Bar */}
      <div className="relative z-10 p-4 border-t border-stone-900/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-black/40 backdrop-blur-xl flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => onRetest(record)}
          className="w-full py-2.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 dark:bg-white dark:hover:bg-stone-100 text-white dark:text-stone-950 text-xs font-sans font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-98 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>载入真题精读并重做</span>
        </button>
      </div>
    </motion.div>
  );
};
