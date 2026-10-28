import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { IELTSTestRecord } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { speakWord } from '../../utils/audioEngine';
import { lookupWord } from '../../utils/lyricDictionary';
import {
  BookOpen,
  Search,
  RotateCcw,
  Clock,
  Target,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  X
} from 'lucide-react';

type ArchiveFilter = 'ALL' | 'MISTAKES' | 'CAMBRIDGE' | 'PERFECT';

interface IELTSArchivesTabProps {
  onOpenReview?: (record: IELTSTestRecord) => void;
}

export const IELTSArchivesTab: React.FC<IELTSArchivesTabProps> = ({ onOpenReview }) => {
  const rawTests = useLiveQuery(() => db.ieltsTests.toArray(), []);
  const tests = useMemo(
    () => (rawTests ? [...rawTests].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)) : []),
    [rawTests]
  );
  const words = useLiveQuery(() => db.words.toArray(), []) || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ArchiveFilter>('ALL');

  const loadArchiveToIELTS = useAppStore(s => s.loadArchiveToIELTS);
  const setActiveSpace = useAppStore(s => s.setActiveSpace);
  const closePersonalHub = useAppStore(s => s.closePersonalHub);
  const openWordDetail = useAppStore(s => s.openWordDetail);

  // Map word -> masteryLevel (0: 未收录, 1-2: 学习中, 3: 已掌握)
  const wordMasteryMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const w of words) {
      if (w.word) {
        map.set(w.word.toLowerCase().trim(), w.masteryLevel ?? 0);
      }
    }
    return map;
  }, [words]);

  const handleWordClick = async (wordText: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const cleaned = wordText.trim();
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

  // Aggregated Analytics & Filter Counts
  const analytics = useMemo(() => {
    const mistakeTestsCount = tests.filter(t => t.correctCount < t.totalQuestions).length;
    const cambridgeCount = tests.filter(t =>
      (t.passageSubtitle || '').toUpperCase().includes('CAMBRIDGE')
    ).length;
    const perfectTestsCount = tests.filter(
      t => t.totalQuestions > 0 && t.correctCount >= t.totalQuestions
    ).length;

    if (tests.length === 0) {
      return {
        totalTests: 0,
        avgBand: 0,
        maxBand: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        accuracyRate: 0,
        avgTimeMinutes: 0,
        mistakeCount: 0,
        mistakeTestsCount: 0,
        cambridgeCount: 0,
        perfectTestsCount: 0,
        overtimeCount: 0,
        timeStatusLabel: '暂无记录',
        isTimeWarning: false,
        comprehensionTier: '暂无评估'
      };
    }

    const totalTests = tests.length;
    const totalBand = tests.reduce((sum, t) => sum + (t.bandScore || 0), 0);
    const maxBand = Math.max(...tests.map(t => t.bandScore || 0));
    const totalQuestions = tests.reduce((sum, t) => sum + (t.totalQuestions || 0), 0);
    const totalCorrect = tests.reduce((sum, t) => sum + (t.correctCount || 0), 0);
    const totalTimeSecs = tests.reduce((sum, t) => sum + (t.timeSpentSec || 0), 0);
    const mistakeCount = Math.max(0, totalQuestions - totalCorrect);
    const accuracyRate = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const avgTimeMinutes = Math.max(1, Math.round(totalTimeSecs / totalTests / 60));

    const overtimeCount = tests.filter(
      t => t.isOvertime || (t.standardTimeSec && t.timeSpentSec > t.standardTimeSec)
    ).length;

    const isTimeWarning = overtimeCount > 0 || avgTimeMinutes > 20;
    const timeStatusLabel =
      overtimeCount > 0
        ? `${overtimeCount}篇超时`
        : avgTimeMinutes > 20
        ? '建议提速'
        : '控时达标';

    let comprehensionTier = '待强化';
    if (accuracyRate >= 85) comprehensionTier = '卓越';
    else if (accuracyRate >= 70) comprehensionTier = '优秀';
    else if (accuracyRate >= 55) comprehensionTier = '稳健';

    return {
      totalTests,
      avgBand: Number((totalBand / totalTests).toFixed(1)),
      maxBand: Number(maxBand.toFixed(1)),
      totalQuestions,
      totalCorrect,
      accuracyRate,
      avgTimeMinutes,
      mistakeCount,
      mistakeTestsCount,
      cambridgeCount,
      perfectTestsCount,
      overtimeCount,
      timeStatusLabel,
      isTimeWarning,
      comprehensionTier
    };
  }, [tests]);

  // Filtered Test List
  const filteredTests = useMemo(() => {
    let result = tests;

    if (activeFilter === 'MISTAKES') {
      result = result.filter(t => t.correctCount < t.totalQuestions);
    } else if (activeFilter === 'CAMBRIDGE') {
      result = result.filter(t => (t.passageSubtitle || '').toUpperCase().includes('CAMBRIDGE'));
    } else if (activeFilter === 'PERFECT') {
      result = result.filter(t => t.totalQuestions > 0 && t.correctCount >= t.totalQuestions);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        t =>
          t.passageTitle.toLowerCase().includes(q) ||
          (t.passageSubtitle && t.passageSubtitle.toLowerCase().includes(q)) ||
          (t.conqueredWords && t.conqueredWords.some(w => w.toLowerCase().includes(q)))
      );
    }

    return result;
  }, [tests, activeFilter, searchQuery]);

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleOpenReview = (record: IELTSTestRecord) => {
    if (onOpenReview) {
      onOpenReview(record);
    }
  };

  const handleRetest = (record: IELTSTestRecord, e?: React.MouseEvent) => {
    e?.stopPropagation();
    loadArchiveToIELTS(record);
    closePersonalHub();
    setActiveSpace(2);
  };

  const handleGoToIELTS = () => {
    closePersonalHub();
    setActiveSpace(2);
  };

  const getBandScoreStyle = (band: number) => {
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
          'bg-emerald-500/10 hover:bg-emerald-500/18 dark:bg-emerald-500/15 dark:hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
      };
    }
    if (level >= 1) {
      return {
        level,
        label: '学习中',
        className:
          'bg-stone-900/[0.06] hover:bg-stone-900/[0.10] dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-stone-800 dark:text-stone-200 border-stone-900/[0.08] dark:border-white/10'
      };
    }
    return {
      level: 0,
      label: '未收录',
      className:
        'bg-stone-900/[0.03] hover:bg-stone-900/[0.07] dark:bg-white/[0.04] dark:hover:bg-white/[0.09] text-stone-600 dark:text-stone-400 border-stone-900/[0.05] dark:border-white/5'
    };
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-300">
      {/* 1. IELTS Academic Analytics Hero Capsule */}
      <div className="rounded-3xl bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] p-5 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.3)] space-y-4">
        {/* Header Title & Total Count */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-stone-800 dark:text-stone-100">
            雅思模考档案
          </h3>
          <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500 tabular-nums">
            累计归档 {analytics.totalTests} 篇
          </span>
        </div>

        {/* Hero KPI Grid */}
        <div className="grid grid-cols-4 gap-2">
          {/* Average Band */}
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-stone-900/[0.05] dark:border-white/[0.05] text-center">
            <span className="text-[10px] font-sans text-stone-400 block mb-0.5 whitespace-nowrap">平均分数</span>
            <span className="text-xl font-mono font-bold text-stone-800 dark:text-stone-100 tracking-tight tabular-nums">
              {analytics.avgBand > 0 ? analytics.avgBand.toFixed(1) : '--'}
            </span>
            <span className="text-[9px] font-sans text-stone-400 block mt-0.5">Band</span>
          </div>

          {/* Peak Band */}
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-stone-900/[0.05] dark:border-white/[0.05] text-center">
            <span className="text-[10px] font-sans text-stone-400 block mb-0.5 whitespace-nowrap">最高表现</span>
            <span className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-tight tabular-nums">
              {analytics.maxBand > 0 ? analytics.maxBand.toFixed(1) : '--'}
            </span>
            <span className="text-[9px] font-sans text-stone-400 block mt-0.5">Peak</span>
          </div>

          {/* Correct Accuracy */}
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-stone-900/[0.05] dark:border-white/[0.05] text-center">
            <span className="text-[10px] font-sans text-stone-400 block mb-0.5 whitespace-nowrap">正确率</span>
            <span className="text-xl font-mono font-bold text-stone-800 dark:text-stone-100 tracking-tight tabular-nums">
              {analytics.totalQuestions > 0 ? `${analytics.accuracyRate}%` : '--'}
            </span>
            <span className="text-[9px] font-sans text-stone-400 block mt-0.5 tabular-nums">
              {analytics.totalCorrect}/{analytics.totalQuestions}题
            </span>
          </div>

          {/* Average Time */}
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-stone-900/[0.05] dark:border-white/[0.05] text-center">
            <span className="text-[10px] font-sans text-stone-400 block mb-0.5 whitespace-nowrap">篇均用时</span>
            <span className="text-xl font-mono font-bold text-stone-800 dark:text-stone-100 tracking-tight tabular-nums">
              {analytics.avgTimeMinutes > 0 ? `${analytics.avgTimeMinutes}m` : '--'}
            </span>
            <span
              className={`text-[9px] font-sans block mt-0.5 whitespace-nowrap ${
                analytics.totalTests === 0
                  ? 'text-stone-400'
                  : analytics.isTimeWarning
                  ? 'text-amber-600 dark:text-amber-400 font-medium'
                  : 'text-emerald-600 dark:text-emerald-400 font-medium'
              }`}
            >
              {analytics.timeStatusLabel}
            </span>
          </div>
        </div>

        {/* Diagnostic Skills Breakdown Gauge */}
        <div className="pt-1 space-y-2 border-t border-stone-900/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 font-sans">
            <span className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>学术真题理解度</span>
            </span>
            <span className="font-mono font-semibold text-stone-700 dark:text-stone-200 tabular-nums">
              {analytics.totalQuestions > 0
                ? `${analytics.accuracyRate}% · ${analytics.comprehensionTier}`
                : '暂无评估'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-stone-900/[0.06] dark:bg-white/[0.08] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 dark:from-emerald-400 dark:to-teal-400 rounded-full transition-all duration-700"
              style={{
                width: `${analytics.totalQuestions > 0 ? analytics.accuracyRate : 0}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Interactive Filter Bar & Search */}
      <div className="space-y-2">
        {/* Search Bar with Quick Clear Button */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索篇目、真题来源、核心考点词..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] text-xs font-sans text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/30 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-900/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="清空搜索"
              aria-label="清空搜索"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4-Column Segmented Filter Bar - Clean, single-line horizontal layout */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { id: 'ALL' as const, label: '全部', count: analytics.totalTests },
            { id: 'MISTAKES' as const, label: '待复盘', count: analytics.mistakeTestsCount },
            { id: 'CAMBRIDGE' as const, label: '剑桥真题', count: analytics.cambridgeCount },
            { id: 'PERFECT' as const, label: '满分归档', count: analytics.perfectTestsCount }
          ].map(tab => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`py-2 px-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-1 tabular-nums ${
                  isActive
                    ? 'bg-stone-900 text-white dark:bg-white dark:text-stone-950 shadow-xs font-semibold'
                    : 'bg-white/45 dark:bg-white/[0.04] text-stone-600 dark:text-stone-400 border border-stone-900/[0.05] dark:border-white/[0.06] hover:bg-white/70'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] font-mono ${isActive ? 'opacity-80' : 'text-stone-400'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Test Records List (Report Cards) */}
      {filteredTests.length === 0 ? (
        <div className="p-8 text-center rounded-3xl bg-white/45 dark:bg-white/[0.04] backdrop-blur-xl border border-dashed border-stone-900/[0.08] dark:border-white/10 space-y-3">
          <BookOpen className="w-9 h-9 text-stone-400 mx-auto opacity-50" />
          <div>
            <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              {searchQuery || activeFilter !== 'ALL' ? '没有匹配的模考记录' : '暂无已归档的雅思模考卷'}
            </p>
            <p className="text-[11px] text-stone-400 mt-1">
              {searchQuery || activeFilter !== 'ALL'
                ? '可以尝试切换筛选标签或清空搜索关键词'
                : '在雅思精读空间完成计时模考后，系统将自动生成权威评分与诊断归档于此'}
            </p>
          </div>
          {searchQuery || activeFilter !== 'ALL' ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-stone-900/10 hover:bg-stone-900/15 dark:bg-white/10 dark:hover:bg-white/15 text-stone-700 dark:text-stone-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>重置筛选条件</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoToIELTS}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-stone-900 text-white dark:bg-white dark:text-stone-950 text-xs font-semibold transition-all cursor-pointer"
            >
              <span>进入雅思精读空间</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTests.map((record, index) => {
            const hasMistakes = record.correctCount < record.totalQuestions;
            const mistakesCount = record.totalQuestions - record.correctCount;
            const isRecordOvertime = Boolean(
              record.isOvertime ||
                (record.standardTimeSec && record.timeSpentSec > record.standardTimeSec)
            );

            return (
              <div
                key={record.id || index}
                onClick={() => handleOpenReview(record)}
                className="group p-4.5 rounded-3xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-xl border border-stone-900/[0.06] dark:border-white/[0.07] transition-all space-y-3 shadow-[0_2px_16px_-4px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] hover:bg-white/70 dark:hover:bg-white/[0.06] hover:border-stone-900/12 dark:hover:border-white/15 cursor-pointer"
              >
                {/* Header Section: Top Kicker + Compact Band Tag, followed by full-width Passage Title */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400 dark:text-stone-500 font-medium truncate">
                      {record.passageSubtitle
                        ? record.passageSubtitle.replace('· ACADEMIC READING', '').trim()
                        : `PASSAGE ${index + 1}`}
                    </span>

                    <div
                      className={`inline-flex items-baseline gap-1 px-2 py-0.5 rounded-lg border whitespace-nowrap shrink-0 tabular-nums ${getBandScoreStyle(
                        record.bandScore
                      )}`}
                    >
                      <span className="text-[10px] font-sans font-medium opacity-75">Band</span>
                      <span className="text-[11px] font-mono font-bold tracking-tight">
                        {record.bandScore.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-stone-900 dark:text-white leading-snug line-clamp-2">
                    {record.passageTitle}
                  </h4>
                </div>

                {/* Single-Line Horizontal Metadata Bar */}
                <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] font-mono text-stone-500 dark:text-stone-400 tabular-nums">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>{formatDuration(record.timeSpentSec)}</span>
                    {isRecordOvertime && (
                      <span className="text-[10px] font-sans text-amber-600 dark:text-amber-400">
                        · 超时
                      </span>
                    )}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">{formatDate(record.timestamp)}</span>
                  <span aria-hidden="true">·</span>
                  {hasMistakes ? (
                    <span className="font-sans font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      答对 {record.correctCount}/{record.totalQuestions} · {mistakesCount}题待复盘
                    </span>
                  ) : (
                    <span className="font-sans font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      答对 {record.correctCount}/{record.totalQuestions} · 满分通过
                    </span>
                  )}
                </div>

                {/* Conquered Key Words Micro Chips */}
                {record.conqueredWords && record.conqueredWords.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                    <span className="text-[10px] font-sans text-stone-400 dark:text-stone-500 mr-0.5 whitespace-nowrap">
                      考点词
                    </span>
                    {record.conqueredWords.map((w, i) => {
                      const chip = getWordChipStyle(w);
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => handleWordClick(w, e)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono border active:scale-95 transition-all cursor-pointer whitespace-nowrap ${chip.className}`}
                          title={`${chip.label} · 点击查词发音`}
                        >
                          {chip.level >= 3 && <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />}
                          <span>{w}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Refined Horizontal Card Footer Actions */}
                <div className="pt-2.5 border-t border-stone-900/[0.05] dark:border-white/[0.06] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleRetest(record, e)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 -ml-1 rounded-xl text-[11px] font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-900/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>重做本篇</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenReview(record);
                    }}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-[11px] font-semibold bg-stone-900/[0.06] group-hover:bg-stone-900 group-hover:text-white dark:bg-white/[0.08] dark:group-hover:bg-white dark:group-hover:text-stone-950 text-stone-800 dark:text-stone-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <span>{hasMistakes ? `错题复盘 (${mistakesCount})` : '查看深度解析'}</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
