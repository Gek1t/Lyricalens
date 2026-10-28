import React, { useEffect, useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppStore } from '../../store/useAppStore';
import { speakWord } from '../../utils/audioEngine';
import { db, toggleWordStar } from '../../db';
import { WordItem } from '../../types';
import {
  Star,
  Volume2,
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const AssessmentSummaryModal: React.FC = () => {
  const assessmentResult = useAppStore(s => s.assessmentResult);
  const isAssessmentModalOpen = useAppStore(s => s.isAssessmentModalOpen);
  const setAssessmentModalOpen = useAppStore(s => s.setAssessmentModalOpen);
  const setActiveSpace = useAppStore(s => s.setActiveSpace);
  const openWordDetail = useAppStore(s => s.openWordDetail);
  const showToast = useAppStore(s => s.showToast);

  const [activeTab, setActiveTab] = useState<'words' | 'questions'>('words');

  // Trigger celebration confetti if band >= 7.0
  useEffect(() => {
    if (isAssessmentModalOpen && assessmentResult && assessmentResult.bandScore >= 7.0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#516050', '#CBD5C8', '#E6DFD5', '#F59E0B']
      });
    }
  }, [isAssessmentModalOpen, assessmentResult]);

  // Query words from Dexie to enrich conquered words data
  const allDbWords = useLiveQuery(() => db.words.toArray(), []) || [];
  const dbWordMap = useMemo(() => {
    const map = new Map<string, WordItem>();
    allDbWords.forEach(w => {
      if (w.word) map.set(w.word.toLowerCase(), w);
    });
    return map;
  }, [allDbWords]);

  if (!isAssessmentModalOpen || !assessmentResult) return null;

  const handleReturnToSong = () => {
    setAssessmentModalOpen(false);
    setActiveSpace(1); // Return to Music Hub (Panel 1)
  };

  const handleToggleStar = async (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    await toggleWordStar(word);
    showToast('Updated star in Vocabulary Vault');
  };

  const isAnswerCorrect = (userAns?: string, correctAns?: string): boolean => {
    if (!userAns || !correctAns) return false;
    const u = userAns.trim().toLowerCase();
    const c = correctAns.trim().toLowerCase();
    if (u === c) return true;
    if (c.startsWith(u + '.') || c.startsWith(u + ' ') || c.startsWith(u + ')')) return true;
    if (u.startsWith(c + '.') || u.startsWith(c + ' ') || u.startsWith(c + ')')) return true;
    return false;
  };

  // Build dynamic conquered words list from assessmentResult
  const dynamicWords = (() => {
    const rawWords = assessmentResult.conqueredWords || [];
    // If none recorded, fallback to targetVocab from questions or passage title
    const effectiveWordList = rawWords.length > 0
      ? rawWords
      : (assessmentResult.questions || [])
          .map(q => q.targetVocab)
          .filter(Boolean) as string[];

    const uniqueWords = Array.from(new Set(effectiveWordList.map(w => w.toLowerCase())));

    if (uniqueWords.length === 0) {
      return [
        {
          word: 'resilience',
          phonetic: '/rɪˈzɪl.jəns/',
          partOfSpeech: 'NOUN',
          definition: 'The capacity to recover quickly from difficulties; toughness.',
          definitionCn: '恢复力，坚韧性，适应力',
          sources: [assessmentResult.passageTitle || 'IELTS Reading'],
          isStarred: true
        }
      ];
    }

    return uniqueWords.map(wordStr => {
      const match = dbWordMap.get(wordStr);
      if (match) {
        return {
          word: match.word,
          phonetic: match.phoneticUk || match.phoneticUs || `/${match.word}/`,
          partOfSpeech: match.partOfSpeech || 'VOCAB',
          definition: match.definition || 'Academic vocabulary in context',
          definitionCn: match.definitionCn || '学术语境核心掌握词汇',
          sources: [assessmentResult.passageTitle || match.sourceContext || 'IELTS Academic Reading'],
          isStarred: Boolean(match.isStarred || (match.masteryLevel ?? 0) > 0)
        };
      }

      // Generic elegant word item
      return {
        word: wordStr,
        phonetic: `/${wordStr}/`,
        partOfSpeech: 'VOCAB',
        definition: `Academic target term encountered in ${assessmentResult.passageTitle || 'reading'}.`,
        definitionCn: `学术核心词汇 · 已在此次模考中掌握`,
        sources: [assessmentResult.passageTitle || 'IELTS Reading'],
        isStarred: true
      };
    });
  })();

  const questions = assessmentResult.questions || [];
  const answers = assessmentResult.answers || {};
  const bandRatio = Math.min(1, Math.max(0, assessmentResult.bandScore / 9.0));
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDashOffset = ringCircumference * (1 - bandRatio);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/55 backdrop-blur-md pointer-events-auto overflow-hidden select-none">
      {/* Modal Sheet Container */}
      <div
        id="assessment-summary-sheet"
        className="relative w-full max-w-xl h-[90dvh] sm:h-[84vh] max-h-[820px] flex flex-col rounded-t-[30px] sm:rounded-[30px] bg-[#FAF7F2] dark:bg-[#0B0F17] border border-stone-200/80 dark:border-white/[0.08] shadow-2xl p-5 sm:p-6 overflow-hidden animate-in slide-in-from-bottom duration-300"
      >
        {/* Pull handle */}
        <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-white/20 mx-auto mb-3 shrink-0" />

        {/* Growth-Compass-Aligned Score Ring & Header */}
        <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-[24px] bg-white/95 dark:bg-[#121722]/95 border border-stone-200/75 dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.02)] mb-3.5 shrink-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-1.5 text-[10.5px] font-mono tabular-nums uppercase tracking-[0.18em] text-[#516050] dark:text-[#8FB996] font-semibold">
              <span>ASSESSMENT REPORT</span>
              <span>·</span>
              <span>
                {assessmentResult.extensionCount && assessmentResult.extensionCount > 0
                  ? `EXTENDED (+${assessmentResult.extensionCount})`
                  : 'STANDARD 20:00'}
              </span>
            </div>

            <h2 className="font-serif-luxury text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-50 tracking-tight truncate">
              {assessmentResult.passageTitle || 'Cambridge Academic Reading'}
            </h2>

            {/* Unboxed Tabular Data Strip */}
            <div className="flex items-center gap-3 pt-1 text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400">
              <span>
                正确率 <strong className="text-stone-900 dark:text-stone-100">{assessmentResult.correctCount}/{assessmentResult.totalQuestions}</strong>
              </span>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <span>
                用时 <strong className="text-stone-900 dark:text-stone-100">{Math.floor(assessmentResult.timeSpentSec / 60)}:{(assessmentResult.timeSpentSec % 60).toString().padStart(2, '0')}</strong>
              </span>
              <span className="text-stone-300 dark:text-stone-700">·</span>
              <span>
                词汇 <strong className="text-[#516050] dark:text-[#8FB996]">+{dynamicWords.length}</strong>
              </span>
            </div>
          </div>

          {/* Precision SVG Band Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-stone-200/70 dark:text-white/[0.08]"
              />
              <circle
                cx="50"
                cy="50"
                r={ringRadius}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringDashOffset}
                className="text-[#516050] dark:text-[#8FB996] transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] font-mono uppercase tracking-widest text-stone-400">BAND</span>
              <span className="font-serif-luxury text-2xl font-bold tabular-nums text-stone-900 dark:text-stone-50 leading-none mt-0.5">
                {assessmentResult.bandScore.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Apple-Style Segmented Switcher: Words vs Question Breakdown */}
        <div className="p-1 rounded-2xl bg-stone-200/55 dark:bg-white/[0.05] border border-stone-200/50 dark:border-white/[0.04] flex items-center gap-1 mb-3.5 shrink-0">
          <button
            onClick={() => setActiveTab('words')}
            className={`flex-1 py-2 rounded-[12px] text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'words'
                ? 'bg-white dark:bg-[#182030] text-stone-900 dark:text-stone-100 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
            }`}
          >
            <span>掌握核心词</span>
            <span className="font-mono tabular-nums text-[11px] text-stone-400">{dynamicWords.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`flex-1 py-2 rounded-[12px] text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'questions'
                ? 'bg-white dark:bg-[#182030] text-stone-900 dark:text-stone-100 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-800'
            }`}
          >
            <span>全卷题目精析</span>
            <span className="font-mono tabular-nums text-[11px] text-stone-400">{questions.length}</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar pr-0.5">
          {activeTab === 'words' ? (
            <div className="rounded-[24px] bg-white/95 dark:bg-[#121722]/95 border border-stone-200/75 dark:border-white/[0.08] divide-y divide-stone-200/60 dark:divide-white/[0.06] overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
              {dynamicWords.map((item, idx) => (
                <div
                  key={`word-item-${item.word}-${idx}`}
                  onClick={() => {
                    openWordDetail({
                      word: item.word,
                      phoneticUk: item.phonetic,
                      phoneticUs: item.phonetic,
                      partOfSpeech: item.partOfSpeech,
                      definition: item.definition,
                      definitionCn: item.definitionCn,
                      examples: [
                        {
                          en: `Encountered in ${item.sources.join(' & ')}.`,
                          cn: `于${item.sources.join(' 与 ')}中成功掌握。`,
                          source: item.sources[0]
                        }
                      ],
                      sourceContext: item.sources[0],
                      isStarred: item.isStarred,
                      addedTimestamp: Date.now()
                    });
                  }}
                  className="p-4 hover:bg-stone-50/80 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h4 className="font-serif-luxury text-base font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#516050] dark:group-hover:text-[#8FB996] transition-colors capitalize">
                          {item.word}
                        </h4>
                        <span className="font-mono text-xs text-stone-400">
                          {item.phonetic}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#516050] dark:text-[#8FB996] font-semibold">
                          · {item.partOfSpeech}
                        </span>
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {item.definitionCn}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakWord(item.word, 'en-GB');
                        }}
                        className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 text-stone-400 hover:text-stone-700 cursor-pointer"
                        title="Pronounce"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleToggleStar(e, item.word)}
                        className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
                        title="Toggle Star"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            item.isStarred
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-300 dark:text-stone-600'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] bg-white/95 dark:bg-[#121722]/95 border border-stone-200/75 dark:border-white/[0.08] divide-y divide-stone-200/60 dark:divide-white/[0.06] overflow-hidden shadow-[0_2px_14px_rgba(0,0,0,0.02)]">
              {questions.map((q, qIdx) => {
                const userAns = answers[q.id];
                const isCorrect = isAnswerCorrect(userAns, q.correctAnswer);
                return (
                  <div
                    key={`summary-q-${q.id ?? ''}-${qIdx}`}
                    className="p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                      <div className="flex items-center gap-1.5 text-stone-400">
                        <span className="text-stone-800 dark:text-stone-200 font-bold">
                          Q{qIdx + 1}
                        </span>
                        <span>·</span>
                        <span className="uppercase">{q.type || 'READING'}</span>
                      </div>

                      {isCorrect ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 正确
                        </span>
                      ) : (
                        <span className="text-rose-500 dark:text-rose-400 flex items-center gap-1 font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> 误判
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-900 dark:text-stone-100 font-medium leading-relaxed">
                      {q.prompt}
                    </p>

                    {/* Unboxed Inline Answer Comparison */}
                    <div className="flex items-center gap-3 text-xs font-mono tabular-nums pt-0.5">
                      <span className={isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-400 line-through'}>
                        作答: {userAns || '未填'}
                      </span>
                      <span className="text-stone-300 dark:text-stone-700">·</span>
                      <span className="text-[#516050] dark:text-[#8FB996] font-semibold">
                        正解: {q.correctAnswer}
                      </span>
                    </div>

                    {q.explanation && (
                      <p className="text-[11.5px] text-stone-500 dark:text-stone-400 leading-relaxed pt-1 border-t border-stone-100 dark:border-white/[0.04]">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-3.5 mt-2 border-t border-stone-200/60 dark:border-white/[0.06] shrink-0">
          <button
            id="review-passage-btn"
            onClick={() => setAssessmentModalOpen(false)}
            className="flex-1 py-3 px-4 rounded-full bg-white dark:bg-white/[0.06] border border-stone-200/80 dark:border-white/[0.08] text-stone-700 dark:text-stone-300 font-sans-ui text-xs font-semibold hover:bg-stone-100 dark:hover:bg-white/[0.1] active:scale-98 transition-all text-center cursor-pointer"
          >
            复盘文章
          </button>

          <button
            id="return-to-daily-song-btn"
            onClick={handleReturnToSong}
            className="flex-[1.4] py-3 px-5 rounded-full bg-[#516050] hover:bg-[#3F4C3E] dark:bg-[#6B8F71] dark:hover:bg-[#4A6B50] text-white font-sans-ui text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
          >
            <span>返回音乐研习</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

